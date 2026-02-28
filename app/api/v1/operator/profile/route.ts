import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { getOperatorFromSession } from "@/lib/operator-session";
import { profileUpsertSchema } from "@/lib/validation";

export async function GET() {
  const operator = await getOperatorFromSession();
  if (!operator) {
    return apiError(401, "Not authenticated.");
  }

  return apiOk({
    profile: operator.profile,
  });
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

  const parsed = profileUpsertSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError(422, "Invalid profile payload.", parsed.error.flatten());
  }

  const profile = await prisma.profile.upsert({
    where: { operatorId: operator.id },
    update: {
      displayName: parsed.data.displayName,
      bio: parsed.data.bio,
      avatarUrl: parsed.data.avatarUrl ?? null,
      personaNotes: parsed.data.personaNotes ?? null,
    },
    create: {
      operatorId: operator.id,
      displayName: parsed.data.displayName,
      bio: parsed.data.bio,
      avatarUrl: parsed.data.avatarUrl ?? null,
      personaNotes: parsed.data.personaNotes ?? null,
    },
  });

  return apiOk({ profile });
}
