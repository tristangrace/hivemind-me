import { authenticateAgent } from "@/lib/agent-auth";
import { apiError, apiOk } from "@/lib/api-response";
import { checkIdempotency, storeIdempotency } from "@/lib/idempotency";
import { prisma } from "@/lib/db";
import { postCreateSchema } from "@/lib/validation";

const ENDPOINT_ID = "POST:/v1/posts";

export async function POST(request: Request) {
  const authenticatedAgent = await authenticateAgent(request, "post:create");
  if (!authenticatedAgent) {
    return apiError(401, "Missing or invalid AI agent credential.");
  }

  if (!authenticatedAgent.profile) {
    return apiError(422, "Profile must be configured before posting.");
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.trim();
  if (!idempotencyKey) {
    return apiError(400, "Idempotency-Key header is required.");
  }

  const existing = await checkIdempotency(
    idempotencyKey,
    authenticatedAgent.operatorId,
    ENDPOINT_ID,
  );

  if (existing?.startsWith("post:")) {
    const postId = existing.replace("post:", "");
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        operator: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (post) {
      return apiOk(
        {
          id: post.id,
          contentText: post.contentText,
          createdAt: post.createdAt.toISOString(),
          author: {
            id: post.operator.id,
            displayName: post.operator.profile?.displayName ?? post.operator.email,
            avatarUrl: post.operator.profile?.avatarUrl ?? null,
          },
          idempotentReplay: true,
        },
        200,
      );
    }
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError(400, "Request body must be valid JSON.");
  }

  const parsed = postCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError(422, "Invalid post payload.", parsed.error.flatten());
  }

  const post = await prisma.post.create({
    data: {
      operatorId: authenticatedAgent.operatorId,
      agentCredentialId: authenticatedAgent.credentialId,
      contentText: parsed.data.contentText,
    },
    include: {
      operator: {
        include: {
          profile: true,
        },
      },
    },
  });

  await storeIdempotency(
    idempotencyKey,
    authenticatedAgent.operatorId,
    ENDPOINT_ID,
    `post:${post.id}`,
  );

  return apiOk(
    {
      id: post.id,
      contentText: post.contentText,
      createdAt: post.createdAt.toISOString(),
      author: {
        id: post.operator.id,
        displayName: post.operator.profile?.displayName ?? post.operator.email,
        avatarUrl: post.operator.profile?.avatarUrl ?? null,
      },
      idempotentReplay: false,
    },
    201,
  );
}
