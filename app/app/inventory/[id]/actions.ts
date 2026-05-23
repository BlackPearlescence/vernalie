"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { forecastBatch } from "@/lib/domain/forecasting";
import { BatchStatus, InfrastructureType } from "@/lib/generated/prisma/enums";
import { getPrisma } from "@/lib/server/prisma";
import { requireWorkspace } from "@/lib/server/workspace";

export async function updateBatchProductionState(formData: FormData) {
  const { nursery } = await requireWorkspace();
  const prisma = getPrisma();
  const batchId = String(formData.get("batchId") ?? "");
  const currentQuantity = Number(formData.get("currentQuantity"));
  const fieldLocation = String(formData.get("fieldLocation") ?? "").trim();
  const statusValue = String(formData.get("status") ?? "");
  const infrastructureValue = String(formData.get("infrastructureType") ?? "");
  const manualShockPercent = Number(formData.get("manualShockPercent") ?? 0);

  if (!batchId || !Number.isInteger(currentQuantity) || currentQuantity < 0 || !fieldLocation) {
    throw new Error("Batch update is missing required production values.");
  }

  if (!isBatchStatus(statusValue) || !isInfrastructureType(infrastructureValue)) {
    throw new Error("Batch update contains an unsupported status or infrastructure type.");
  }

  const batch = await prisma.livingBatch.findFirst({
    where: {
      id: batchId,
      nurseryId: nursery.id,
    },
    include: {
      category: {
        include: {
          genus: true,
        },
      },
    },
  });

  if (!batch) {
    throw new Error("Batch not found for this nursery.");
  }

  const manualShockFactor = clampRate(manualShockPercent / 100);
  const forecast = forecastBatch({
    id: batch.id,
    nurseryUsdaZone: nursery.usdaZone,
    lifecycleType: batch.category.lifecycleType,
    startingQuantity: batch.startingQuantity,
    currentQuantity,
    baseLossRate: batch.category.genus.baseLossRate,
    decayModifier: batch.category.decayModifier,
    minSurvivalZone: batch.category.minSurvivalZone,
    weeksToHarvest: batch.category.weeksToHarvest,
    infrastructureType: infrastructureValue,
    manualShockFactor,
    datePlanted: batch.datePlanted,
  });

  await prisma.livingBatch.update({
    where: {
      id: batch.id,
    },
    data: {
      currentQuantity,
      fieldLocation,
      status: statusValue,
      infrastructureType: infrastructureValue,
      manualShockFactor,
      projectedYield: forecast.projectedYield,
      estimatedReadyDate: forecast.estimatedReadyDate,
    },
  });

  revalidatePath("/app/dashboard");
  revalidatePath("/app/inventory");
  revalidatePath(`/app/inventory/${batch.id}`);
  redirect(`/app/inventory/${batch.id}`);
}

function isBatchStatus(value: string): value is BatchStatus {
  return Object.values(BatchStatus).includes(value as BatchStatus);
}

function isInfrastructureType(value: string): value is InfrastructureType {
  return Object.values(InfrastructureType).includes(value as InfrastructureType);
}

function clampRate(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1);
}
