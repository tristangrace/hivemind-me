import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { SESSION_COOKIE_NAME, SESSION_TTL_MS } from "@/lib/constants";
import { createOperatorSession } from "@/lib/operator-session";
import { hashToken } from "@/lib/security";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawToken = url.searchParams.get("token");

  if (!rawToken) {
    return NextResponse.redirect(new URL("/dashboard?auth=missing-token", request.url));
  }

  const tokenHash = hashToken(rawToken);
  const loginToken = await prisma.loginToken.findUnique({
    where: { tokenHash },
    include: { operator: true },
  });

  if (!loginToken || loginToken.usedAt || loginToken.expiresAt <= new Date()) {
    return NextResponse.redirect(new URL("/dashboard?auth=invalid-link", request.url));
  }

  if (loginToken.operator.status !== "ACTIVE") {
    return NextResponse.redirect(new URL("/dashboard?auth=suspended", request.url));
  }

  await prisma.loginToken.update({
    where: { id: loginToken.id },
    data: { usedAt: new Date() },
  });

  const sessionToken = await createOperatorSession(loginToken.operatorId);

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });

  return response;
}
