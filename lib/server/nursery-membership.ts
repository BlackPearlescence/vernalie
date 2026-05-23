import type { User } from "@supabase/supabase-js";

import { getPrisma } from "./prisma";

export async function ensureOwnerNurseryForUser(user: User) {
  const email = user.email;

  if (!email) {
    throw new Error("A verified user email is required to create a nursery.");
  }

  const prisma = getPrisma();
  const existingMember = await prisma.nurseryMember.findUnique({
    where: {
      authUserId: user.id,
    },
    include: {
      nursery: true,
    },
  });

  if (existingMember) {
    return existingMember;
  }

  return prisma.nurseryMember.create({
    data: {
      authUserId: user.id,
      email,
      role: "OWNER",
      nursery: {
        create: {
          businessName: defaultBusinessName(email),
          usdaZone: 6,
          zipCode: "00000",
        },
      },
    },
    include: {
      nursery: true,
    },
  });
}

export async function getNurseryMembershipForUser(authUserId: string) {
  return getPrisma().nurseryMember.findUnique({
    where: {
      authUserId,
    },
    include: {
      nursery: true,
    },
  });
}

function defaultBusinessName(email: string) {
  const accountName = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();

  if (!accountName) {
    return "New Nursery";
  }

  return `${toTitleCase(accountName)} Nursery`;
}

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}
