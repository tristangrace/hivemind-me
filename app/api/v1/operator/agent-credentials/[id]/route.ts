import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { getOperatorFromSession } from "@/lib/operator-session";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const operator = await getOperatorFromSession();
  if (!operator) {
    return apiError(401, "Not authenticated.");
  }

  const { id } = await context.params;

  const credential = await prisma.agentCredential.findUnique({
    where: { id },
    select: {
      id: true,
      operatorId: true,
      status: true,
    },
  });

  if (!credential || credential.operatorId !== operator.id) {
    return apiError(404, "Credential not found.");
  }

  if (credential.status === "REVOKED") {
    return apiOk({ revoked: true });
  }

  await prisma.agentCredential.update({
    where: { id: credential.id },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
    },
  });

  return apiOk({ revoked: true });
}
