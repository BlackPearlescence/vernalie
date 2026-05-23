import "server-only";

import {
  buildDashboardReadModel,
  type ContractCommitmentInput,
  type DashboardBatchInput,
} from "@/lib/domain/dashboard";

import { getPrisma } from "./prisma";

export async function getDashboardForNursery(nurseryId: string) {
  const prisma = getPrisma();
  const [batches, commitments] = await Promise.all([
    prisma.livingBatch.findMany({
      where: {
        nurseryId,
      },
      include: {
        nursery: true,
        category: {
          include: {
            genus: true,
          },
        },
      },
      orderBy: [
        {
          estimatedReadyDate: "asc",
        },
        {
          fieldLocation: "asc",
        },
      ],
    }),
    prisma.contractCommitment.findMany({
      where: {
        nurseryId,
      },
      orderBy: {
        targetShipDate: "asc",
      },
    }),
  ]);

  return buildDashboardReadModel({
    batches: batches.map(mapBatchToDashboardInput),
    commitments: commitments.map(mapCommitmentToDashboardInput),
  });
}

type PrismaBatch = Awaited<
  ReturnType<ReturnType<typeof getPrisma>["livingBatch"]["findMany"]>
>[number] & {
  nursery: {
    usdaZone: number;
  };
  category: {
    cultivarName: string;
    lifecycleType: DashboardBatchInput["lifecycleType"];
    minSurvivalZone: number;
    decayModifier: number;
    weeksToHarvest: number;
    genus: {
      scientificName: string;
      commonName: string | null;
      baseLossRate: number;
    };
  };
};

type PrismaCommitment = Awaited<
  ReturnType<ReturnType<typeof getPrisma>["contractCommitment"]["findMany"]>
>[number];

function mapBatchToDashboardInput(batch: PrismaBatch): DashboardBatchInput {
  return {
    id: batch.id,
    genusName: batch.category.genus.scientificName,
    categoryLabel: batch.category.genus.commonName ?? batch.category.genus.scientificName,
    cultivarName: batch.category.cultivarName,
    nurseryUsdaZone: batch.nursery.usdaZone,
    lifecycleType: batch.category.lifecycleType,
    startingQuantity: batch.startingQuantity,
    currentQuantity: batch.currentQuantity,
    baseLossRate: batch.category.genus.baseLossRate,
    decayModifier: batch.category.decayModifier,
    minSurvivalZone: batch.category.minSurvivalZone,
    weeksToHarvest: batch.category.weeksToHarvest,
    infrastructureType: batch.infrastructureType,
    manualShockFactor: batch.manualShockFactor,
    datePlanted: batch.datePlanted,
    fieldLocation: batch.fieldLocation,
    status: batch.status,
  };
}

function mapCommitmentToDashboardInput(
  commitment: PrismaCommitment,
): ContractCommitmentInput {
  return {
    id: commitment.id,
    batchId: commitment.batchId,
    externalRef: commitment.externalRef,
    committedQuantity: commitment.committedQuantity,
    targetShipDate: commitment.targetShipDate,
  };
}
