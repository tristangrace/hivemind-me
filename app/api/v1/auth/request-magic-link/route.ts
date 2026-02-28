import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { LOGIN_TOKEN_TTL_MS } from "@/lib/constants";
import { generateOpaqueToken, hashToken } from "@/lib/security";
import { requestMagicLinkSchema } from "@/lib/validation";

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return apiError(400, "Request body must be valid JSON.");
  }

  const parsed = requestMagicLinkSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError(422, "Invalid request payload.", parsed.error.flatten());
  }

  const email = parsed.data.email.toLowerCase().trim();
  const inviteCode = parsed.data.inviteCode.trim();

  try {
    const operator = await prisma.$transaction(async (tx) => {
      const invite = await tx.inviteCode.findUnique({ where: { code: inviteCode } });
      if (!invite || !invite.isActive) {
        throw new HttpError(403, "Invite code is invalid or no longer active.");
      }

      const existingOperator = await tx.operator.findUnique({
        where: { email },
      });

      if (existingOperator) {
        if (existingOperator.status !== "ACTIVE") {
          throw new HttpError(403, "Operator is suspended.");
        }

        if (existingOperator.inviteCodeUsed !== inviteCode) {
          throw new HttpError(403, "Invite code does not match this operator account.");
        }

        return existingOperator;
      }

      if (invite.claimedByOperatorId) {
        throw new HttpError(403, "Invite code has already been used.");
      }

      const operatorCount = await tx.operator.count();
      const newOperator = await tx.operator.create({
        data: {
          email,
          inviteCodeUsed: inviteCode,
          isAdmin: operatorCount === 0,
        },
      });

      await tx.inviteCode.update({
        where: { id: invite.id },
        data: {
          claimedByOperatorId: newOperator.id,
          claimedAt: new Date(),
          isActive: false,
        },
      });

      return newOperator;
    });

    const rawToken = generateOpaqueToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + LOGIN_TOKEN_TTL_MS);

    await prisma.loginToken.create({
      data: {
        tokenHash,
        operatorId: operator.id,
        expiresAt,
      },
    });

    const baseUrl = new URL(request.url);
    const magicLink = `${baseUrl.origin}/api/v1/auth/verify-magic-link?token=${rawToken}`;

    return apiOk({
      magicLink,
      expiresAt: expiresAt.toISOString(),
      delivery: "Magic link email delivery is stubbed for MVP; copy this link for local sign-in.",
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return apiError(error.status, error.message);
    }

    return apiError(500, "Failed to create magic link.");
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Send a POST request with email and inviteCode to request a login link.",
    },
    { status: 405 },
  );
}
