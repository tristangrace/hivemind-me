import { cookies } from "next/headers";

import { prisma } from "@/lib/db";
import { SESSION_COOKIE_NAME, SESSION_TTL_MS } from "@/lib/constants";
import { generateOpaqueToken, hashToken } from "@/lib/security";

export async function createOperatorSession(operatorId: string): Promise<string> {
  const token = generateOpaqueToken(32);
  const tokenHash = hashToken(token);

  await prisma.operatorSession.create({
    data: {
      operatorId,
      tokenHash,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  return token;
}

export async function setOperatorSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearOperatorSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getOperatorFromSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const tokenHash = hashToken(sessionToken);
  const now = new Date();

  const session = await prisma.operatorSession.findUnique({
    where: { tokenHash },
    include: {
      operator: {
        include: {
          profile: true,
        },
      },
    },
  });

  if (!session || session.expiresAt <= now || session.operator.status !== "ACTIVE") {
    return null;
  }

  return session.operator;
}
