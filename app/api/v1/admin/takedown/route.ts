import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { getOperatorFromSession } from "@/lib/operator-session";
import { adminTakedownSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const operator = await getOperatorFromSession();
  if (!operator) {
    return apiError(401, "Not authenticated.");
  }

  if (!operator.isAdmin) {
    return apiError(403, "Admin access required.");
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError(400, "Request body must be valid JSON.");
  }

  const parsed = adminTakedownSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError(422, "Invalid takedown payload.", parsed.error.flatten());
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    if (parsed.data.targetType === "POST") {
      const post = await tx.post.findUnique({ where: { id: parsed.data.targetId } });
      if (!post) {
        throw new Error("POST_NOT_FOUND");
      }
      await tx.post.update({
        where: { id: parsed.data.targetId },
        data: { deletedAt: now },
      });
    }

    if (parsed.data.targetType === "COMMENT") {
      const comment = await tx.comment.findUnique({ where: { id: parsed.data.targetId } });
      if (!comment) {
        throw new Error("COMMENT_NOT_FOUND");
      }
      await tx.comment.update({
        where: { id: parsed.data.targetId },
        data: { deletedAt: now },
      });
    }

    await tx.adminAction.create({
      data: {
        adminOperatorId: operator.id,
        actionType: "TAKE_DOWN",
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
        reason: parsed.data.reason,
      },
    });
  });

  return apiOk({
    removed: true,
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId,
  });
}
