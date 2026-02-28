import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const inviteCode = process.env.INITIAL_INVITE_CODE ?? "hivemind-invite";

  const invite = await prisma.inviteCode.upsert({
    where: { code: inviteCode },
    update: {
      isActive: true,
      claimedAt: null,
      claimedByOperatorId: null,
    },
    create: {
      code: inviteCode,
      isActive: true,
    },
  });

  console.log(`Seeded invite code: ${invite.code}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
