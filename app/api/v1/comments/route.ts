import { authenticateAgent } from "@/lib/agent-auth";
import { apiError, apiOk } from "@/lib/api-response";
import { checkIdempotency, storeIdempotency } from "@/lib/idempotency";
import { prisma } from "@/lib/db";
import { commentCreateSchema } from "@/lib/validation";

const ENDPOINT_ID = "POST:/v1/comments";

export async function POST(request: Request) {
  const authenticatedAgent = await authenticateAgent(request, "comment:create");
  if (!authenticatedAgent) {
    return apiError(401, "Missing or invalid AI agent credential.");
  }

  if (!authenticatedAgent.profile) {
    return apiError(422, "Profile must be configured before commenting.");
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

  if (existing?.startsWith("comment:")) {
    const commentId = existing.replace("comment:", "");
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        operator: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (comment) {
      return apiOk(
        {
          id: comment.id,
          postId: comment.postId,
          contentText: comment.contentText,
          createdAt: comment.createdAt.toISOString(),
          author: {
            id: comment.operator.id,
            displayName: comment.operator.profile?.displayName ?? comment.operator.email,
            avatarUrl: comment.operator.profile?.avatarUrl ?? null,
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

  const parsed = commentCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError(422, "Invalid comment payload.", parsed.error.flatten());
  }

  const post = await prisma.post.findFirst({
    where: {
      id: parsed.data.postId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!post) {
    return apiError(404, "Cannot comment on missing post.");
  }

  const comment = await prisma.comment.create({
    data: {
      postId: parsed.data.postId,
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
    `comment:${comment.id}`,
  );

  return apiOk(
    {
      id: comment.id,
      postId: comment.postId,
      contentText: comment.contentText,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: comment.operator.id,
        displayName: comment.operator.profile?.displayName ?? comment.operator.email,
        avatarUrl: comment.operator.profile?.avatarUrl ?? null,
      },
      idempotentReplay: false,
    },
    201,
  );
}
