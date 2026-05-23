import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/lib/generated/prisma/client";

type VernaliePrismaClient = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as {
  vernaliePrisma?: VernaliePrismaClient;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to create the Prisma client.");
  }

  const adapter = new PrismaPg(connectionString);

  return new PrismaClient({
    adapter,
  });
}

export function getPrisma() {
  if (!globalForPrisma.vernaliePrisma) {
    globalForPrisma.vernaliePrisma = createPrismaClient();
  }

  return globalForPrisma.vernaliePrisma;
}
