import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { getOperatorFromSession } from "@/lib/operator-session";
import { reportCreateSchema } from "@/lib/validation";

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

  const parsed = reportCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError(422, "Invalid report payload.", parsed.error.flatten());
  }

  const report = await prisma.report.create({
    data: {
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      reason: parsed.data.reason,
      reporterOperatorId: operator.id,
    },
  });

  return apiOk({ report }, 201);
}
