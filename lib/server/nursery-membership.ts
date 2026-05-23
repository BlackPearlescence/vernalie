import type { User } from "@supabase/supabase-js";

import { getPrisma } from "./prisma";

type NurserySignupProfile = {
  businessName?: string;
  usdaZone?: number;
  zipCode?: string;
};

export async function ensureOwnerNurseryForUser(
  user: User,
  profile: NurserySignupProfile = profileFromUserMetadata(user),
) {
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
          businessName: profile.businessName?.trim() || defaultBusinessName(email),
          usdaZone: profile.usdaZone ?? 6,
          zipCode: profile.zipCode?.trim() || "00000",
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

function profileFromUserMetadata(user: User): NurserySignupProfile {
  const metadata = user.user_metadata;
  const usdaZone = Number(metadata.usdaZone);

  return {
    businessName:
      typeof metadata.businessName === "string" ? metadata.businessName : undefined,
    usdaZone: Number.isInteger(usdaZone) && usdaZone > 0 ? usdaZone : undefined,
    zipCode: typeof metadata.zipCode === "string" ? metadata.zipCode : undefined,
  };
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
