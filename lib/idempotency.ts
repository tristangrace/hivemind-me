import { IDEMPOTENCY_TTL_MS } from "@/lib/constants";
import { prisma } from "@/lib/db";

export async function checkIdempotency(
  key: string,
  operatorId: string,
  endpoint: string,
): Promise<string | null> {
  const existing = await prisma.idempotencyKey.findUnique({
    where: { key },
  });

  if (!existing) {
    return null;
  }

  if (existing.expiresAt <= new Date()) {
    await prisma.idempotencyKey.delete({ where: { key } });
    return null;
  }

  if (existing.operatorId !== operatorId || existing.endpoint !== endpoint) {
    return null;
  }

  return existing.responseHash;
}

export async function storeIdempotency(
  key: string,
  operatorId: string,
  endpoint: string,
  responseHash: string,
) {
  await prisma.idempotencyKey.upsert({
    where: { key },
    create: {
      key,
      operatorId,
      endpoint,
      responseHash,
      expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
    },
    update: {
      operatorId,
      endpoint,
      responseHash,
      expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
    },
  });
}
