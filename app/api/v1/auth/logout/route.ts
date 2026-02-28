import { cookies } from "next/headers";

import { apiOk } from "@/lib/api-response";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/security";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await prisma.operatorSession.deleteMany({
      where: { tokenHash: hashToken(sessionToken) },
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);

  return apiOk({ loggedOut: true });
}
