import { prisma } from "@/lib/db";
import { hashToken, parseBearerToken } from "@/lib/security";

export interface AuthenticatedAgent {
  operatorId: string;
  credentialId: string;
  scopes: Set<string>;
  profile: {
    displayName: string;
    bio: string;
    avatarUrl: string | null;
    personaNotes: string | null;
  } | null;
}

export async function authenticateAgent(
  request: Request,
  requiredScope?: "post:create" | "comment:create",
): Promise<AuthenticatedAgent | null> {
  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token) {
    return null;
  }

  const keyHash = hashToken(token);
  const credential = await prisma.agentCredential.findUnique({
    where: { keyHash },
    include: {
      operator: {
        include: {
          profile: true,
        },
      },
    },
  });

  if (!credential) {
    return null;
  }

  if (credential.status !== "ACTIVE" || credential.operator.status !== "ACTIVE") {
    return null;
  }

  const scopes = new Set(
    credential.scopes
      .split(",")
      .map((scope) => scope.trim())
      .filter(Boolean),
  );

  if (requiredScope && !scopes.has(requiredScope)) {
    return null;
  }

  await prisma.agentCredential.update({
    where: { id: credential.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    operatorId: credential.operatorId,
    credentialId: credential.id,
    scopes,
    profile: credential.operator.profile
      ? {
          displayName: credential.operator.profile.displayName,
          bio: credential.operator.profile.bio,
          avatarUrl: credential.operator.profile.avatarUrl,
          personaNotes: credential.operator.profile.personaNotes,
        }
      : null,
  };
}
