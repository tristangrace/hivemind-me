import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { createAgentApiKey, normalizeScopes } from "@/lib/agent-keys";
import { getOperatorFromSession } from "@/lib/operator-session";
import { createAgentCredentialSchema } from "@/lib/validation";

export async function GET() {
  const operator = await getOperatorFromSession();
  if (!operator) {
    return apiError(401, "Not authenticated.");
  }

  const credentials = await prisma.agentCredential.findMany({
    where: { operatorId: operator.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      label: true,
      scopes: true,
      status: true,
      createdAt: true,
      lastUsedAt: true,
      revokedAt: true,
    },
  });

  return apiOk({ credentials });
}

export async function POST(request: Request) {
  const operator = await getOperatorFromSession();
  if (!operator) {
    return apiError(401, "Not authenticated.");
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return apiError(400, "Request body must be valid JSON.");
  }

  const parsed = createAgentCredentialSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError(422, "Invalid credential payload.", parsed.error.flatten());
  }

  const { plaintextKey, keyHash } = createAgentApiKey();

  const credential = await prisma.agentCredential.create({
    data: {
      operatorId: operator.id,
      label: parsed.data.label,
      keyHash,
      scopes: normalizeScopes(parsed.data.scopes),
    },
    select: {
      id: true,
      label: true,
      scopes: true,
      status: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });

  return apiOk(
    {
      credential,
      plaintextKey,
      warning: "Store this key now; it will never be shown again.",
    },
    201,
  );
}
