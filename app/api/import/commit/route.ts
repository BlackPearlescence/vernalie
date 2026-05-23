import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { forecastBatch } from "@/lib/domain/forecasting";
import {
  buildDraftDuplicateKey,
  buildExistingBatchDuplicateKey,
} from "@/lib/domain/import-dedupe";
import type { ImportColumnMapping } from "@/lib/domain/importer";
import type { Prisma } from "@/lib/generated/prisma/client";
import { BatchStatus, InfrastructureType } from "@/lib/generated/prisma/enums";
import { getPrisma } from "@/lib/server/prisma";
import { ensureOwnerNurseryForUser } from "@/lib/server/nursery-membership";
import { getCurrentUser } from "@/lib/supabase/server";

type ImportDraftPayload = {
  speciesName: string;
  cultivarName: string;
  quantity: number;
  fieldLocation: string;
  infrastructureType: string;
  datePlanted: string;
  status: string;
  manualShockFactor: number;
  contract?: {
    externalRef: string;
    committedQuantity: number;
    targetShipDate: string;
  };
  duplicate?: {
    kind: "database" | "file";
    existingBatchId?: string;
    firstRowNumber?: number;
    message: string;
  };
};

type CommitPayload = {
  fileName: string;
  headers: string[];
  mapping: ImportColumnMapping;
  drafts: ImportDraftPayload[];
};

export const runtime = "nodejs";

const COMMON_SPECIES_TO_SCIENTIFIC_NAME: Record<string, string> = {
  apple: "Malus domestica",
  pear: "Pyrus communis",
  peach: "Prunus persica",
  plum: "Prunus domestica",
  cherry: "Prunus cerasus",
  blueberry: "Vaccinium corymbosum",
  strawberry: "Fragaria x ananassa",
  raspberry: "Rubus idaeus",
  tomato: "Solanum lycopersicum",
  pepper: "Capsicum annuum",
  eggplant: "Solanum melongena",
  lettuce: "Lactuca sativa",
  kale: "Brassica oleracea",
  basil: "Ocimum basilicum",
  mint: "Mentha spicata",
  rosemary: "Rosmarinus officinalis",
  lavender: "Lavandula x intermedia",
  echinacea: "Echinacea purpurea",
  hosta: "Hosta",
  marigold: "Tagetes erecta",
  petunia: "Petunia x hybrida",
  zinnia: "Zinnia elegans",
  salvia: "Salvia farinacea",
};

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const membership = await ensureOwnerNurseryForUser(user);
  const nursery = membership.nursery;
  const prisma = getPrisma();
  const payload = (await request.json()) as CommitPayload;

  if (!payload.fileName || !Array.isArray(payload.headers) || !Array.isArray(payload.drafts)) {
    return NextResponse.json({ message: "Import payload is incomplete." }, { status: 400 });
  }

  if (payload.drafts.length === 0) {
    return NextResponse.json({ message: "There are no valid rows to import." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const importJob = await tx.importJob.create({
          data: {
            nurseryId: nursery.id,
            status: "VALIDATING",
            originalFileName: payload.fileName,
            headerSnapshot: {
              headers: payload.headers,
              mapping: payload.mapping,
            },
            rowCount: payload.drafts.length,
          },
        });

        if (
          payload.mapping.species &&
          payload.mapping.quantity &&
          payload.mapping.location
        ) {
          await tx.excelLayout.upsert({
            where: {
              nurseryId_layoutName: {
                nurseryId: nursery.id,
                layoutName: "Default",
              },
            },
            update: {
              speciesKey: payload.mapping.species,
              cultivarKey: payload.mapping.cultivar,
              quantityKey: payload.mapping.quantity,
              locationKey: payload.mapping.location,
              plantedKey: payload.mapping.datePlanted,
            },
            create: {
              nurseryId: nursery.id,
              layoutName: "Default",
              speciesKey: payload.mapping.species,
              cultivarKey: payload.mapping.cultivar,
              quantityKey: payload.mapping.quantity,
              locationKey: payload.mapping.location,
              plantedKey: payload.mapping.datePlanted,
            },
          });
        }

        const existingBatches = await tx.livingBatch.findMany({
          where: {
            nurseryId: nursery.id,
          },
          select: {
            id: true,
            startingQuantity: true,
            fieldLocation: true,
            infrastructureType: true,
            datePlanted: true,
            category: {
              select: {
                cultivarName: true,
              },
            },
          },
        });
        const duplicateKeys = new Set(existingBatches.map(buildExistingBatchDuplicateKey));
        const importedBatchIds: string[] = [];
        const skippedDuplicates: Array<{
          cultivarName: string;
          fieldLocation: string;
          datePlanted: string;
          reason: string;
        }> = [];
        const createdCategories = new Set<string>();
        const matchedCategories = new Set<string>();
        let importedCount = 0;
        let commitmentCount = 0;

        for (const draft of payload.drafts) {
          const duplicateKey = buildDraftDuplicateKey(draft);

          if (duplicateKeys.has(duplicateKey)) {
            skippedDuplicates.push({
              cultivarName: draft.cultivarName,
              fieldLocation: draft.fieldLocation,
              datePlanted: draft.datePlanted,
              reason: "Matched an existing batch or an earlier row in this import.",
            });
            continue;
          }

          duplicateKeys.add(duplicateKey);
          const category = await resolveCategory(tx, draft, nursery.usdaZone);

          if (category.createdForImport) {
            createdCategories.add(`${draft.speciesName} · ${draft.cultivarName}`);
          } else {
            matchedCategories.add(`${draft.speciesName} · ${draft.cultivarName}`);
          }

          const infrastructureType = normalizeInfrastructureType(draft.infrastructureType);
          const status = normalizeBatchStatus(draft.status);
          const datePlanted = new Date(draft.datePlanted);
          const forecast = forecastBatch({
            id: `${payload.fileName}:${importedCount}`,
            nurseryUsdaZone: nursery.usdaZone,
            lifecycleType: category.lifecycleType,
            startingQuantity: draft.quantity,
            currentQuantity: draft.quantity,
            baseLossRate: category.genus.baseLossRate,
            decayModifier: category.decayModifier,
            minSurvivalZone: category.minSurvivalZone,
            weeksToHarvest: category.weeksToHarvest,
            infrastructureType,
            manualShockFactor: draft.manualShockFactor,
            datePlanted,
          });

          const batch = await tx.livingBatch.create({
            data: {
              nurseryId: nursery.id,
              categoryId: category.id,
              startingQuantity: draft.quantity,
              currentQuantity: draft.quantity,
              projectedYield: forecast.projectedYield,
              status,
              fieldLocation: draft.fieldLocation,
              infrastructureType,
              manualShockFactor: draft.manualShockFactor,
              datePlanted,
              estimatedReadyDate: forecast.estimatedReadyDate,
            },
          });

          importedCount += 1;
          importedBatchIds.push(batch.id);

          if (draft.contract) {
            await tx.contractCommitment.create({
              data: {
                nurseryId: nursery.id,
                batchId: batch.id,
                externalRef: draft.contract.externalRef,
                committedQuantity: draft.contract.committedQuantity,
                targetShipDate: new Date(draft.contract.targetShipDate),
              },
            });
            commitmentCount += 1;
          }
        }

        await tx.importJob.update({
          where: {
            id: importJob.id,
          },
          data: {
            status: "IMPORTED",
            rowCount: payload.drafts.length,
            headerSnapshot: {
              headers: payload.headers,
              mapping: payload.mapping,
              result: {
                importedCount,
                commitmentCount,
                duplicateCount: skippedDuplicates.length,
                importedBatchIds,
                skippedDuplicates,
                createdCategories: Array.from(createdCategories),
                matchedCategories: Array.from(matchedCategories),
              },
            },
          },
        });

        return {
          importJobId: importJob.id,
          importedCount,
          commitmentCount,
          duplicateCount: skippedDuplicates.length,
        };
      },
      {
        maxWait: 10_000,
        timeout: 60_000,
      },
    );

    revalidatePath("/app/dashboard");
    revalidatePath("/app/import");
    revalidatePath(`/app/import/${result.importJobId}`);

    return NextResponse.json(result);
  } catch (error) {
    await prisma.importJob.create({
      data: {
        nurseryId: nursery.id,
        status: "FAILED",
        originalFileName: payload.fileName || "Unknown import",
        headerSnapshot: {
          headers: payload.headers ?? [],
          mapping: payload.mapping ?? {},
        },
        rowCount: payload.drafts?.length ?? 0,
        errorMessage: error instanceof Error ? error.message : "Import failed.",
      },
    });

    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Import failed.",
      },
      { status: 400 },
    );
  }
}

async function resolveCategory(
  tx: Prisma.TransactionClient,
  draft: ImportDraftPayload,
  nurseryUsdaZone: number,
) {
  const speciesKey = draft.speciesName.trim().toLowerCase();
  const scientificName = COMMON_SPECIES_TO_SCIENTIFIC_NAME[speciesKey] ?? draft.speciesName;
  const genus = await tx.plantGenus.upsert({
    where: {
      scientificName,
    },
    update: {
      commonName: draft.speciesName,
    },
    create: {
      scientificName,
      commonName: draft.speciesName,
      baseLossRate: inferBaseLossRate(draft),
    },
  });

  const existingCategory = await tx.plantCategory.findUnique({
    where: {
      genusId_cultivarName: {
        genusId: genus.id,
        cultivarName: draft.cultivarName,
      },
    },
    include: {
      genus: true,
    },
  });

  if (existingCategory) {
    return {
      ...existingCategory,
      createdForImport: false,
    };
  }

  const category = await tx.plantCategory.create({
    data: {
      genusId: genus.id,
      cultivarName: draft.cultivarName,
      lifecycleType: inferLifecycleType(draft),
      minSurvivalZone: Math.max(1, nurseryUsdaZone - 1),
      decayModifier: 0,
      weeksToHarvest: inferWeeksToHarvest(draft),
    },
    include: {
      genus: true,
    },
  });

  return {
    ...category,
    createdForImport: true,
  };
}

function normalizeInfrastructureType(value: string) {
  return Object.values(InfrastructureType).includes(value as InfrastructureType)
    ? (value as InfrastructureType)
    : InfrastructureType.GREENHOUSE;
}

function normalizeBatchStatus(value: string) {
  return Object.values(BatchStatus).includes(value as BatchStatus)
    ? (value as BatchStatus)
    : BatchStatus.IN_PRODUCTION;
}

function inferLifecycleType(draft: ImportDraftPayload) {
  const species = draft.speciesName.toLowerCase();

  if (["tomato", "pepper", "eggplant", "lettuce", "kale", "marigold", "petunia", "zinnia", "salvia"].includes(species)) {
    return "RAPID_ANNUAL" as const;
  }

  if (["mint", "strawberry"].includes(species)) {
    return "PROPAGATION_RUNNER" as const;
  }

  return "MULTI_YEAR_PERENNIAL" as const;
}

function inferWeeksToHarvest(draft: ImportDraftPayload) {
  const lifecycleType = inferLifecycleType(draft);

  if (lifecycleType === "RAPID_ANNUAL") {
    return 8;
  }

  if (lifecycleType === "PROPAGATION_RUNNER") {
    return 14;
  }

  return 52;
}

function inferBaseLossRate(draft: ImportDraftPayload) {
  return inferLifecycleType(draft) === "RAPID_ANNUAL" ? 0.06 : 0.08;
}
