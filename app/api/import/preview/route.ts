import { NextResponse } from "next/server";

import {
  buildDraftDuplicateKey,
  buildExistingBatchDuplicateKey,
} from "@/lib/domain/import-dedupe";
import {
  buildImportDrafts,
  inferColumnMapping,
  parseSpreadsheetBuffer,
  type ImportColumnMapping,
} from "@/lib/domain/importer";
import { getPrisma } from "@/lib/server/prisma";
import { ensureOwnerNurseryForUser } from "@/lib/server/nursery-membership";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const membership = await ensureOwnerNurseryForUser(user);
  const prisma = getPrisma();
  const formData = await request.formData();
  const file = formData.get("file");
  const mappingValue = formData.get("mapping");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Attach a CSV or XLSX file." }, { status: 400 });
  }

  try {
    const mapping =
      typeof mappingValue === "string" && mappingValue
        ? (JSON.parse(mappingValue) as ImportColumnMapping)
        : undefined;
    const buffer = Buffer.from(await file.arrayBuffer());
    const sheet = await parseSpreadsheetBuffer(file.name, buffer);
    const inferredMapping = inferColumnMapping(sheet.headers);
    const activeMapping = mapping ?? inferredMapping;
    const result = buildImportDrafts(sheet, activeMapping);
    const existingBatches = await prisma.livingBatch.findMany({
      where: {
        nurseryId: membership.nurseryId,
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
    const existingKeys = new Map(
      existingBatches.map((batch) => [buildExistingBatchDuplicateKey(batch), batch.id] as const),
    );
    const fileKeys = new Map<string, number>();

    return NextResponse.json({
      fileName: sheet.fileName,
      sheetName: sheet.sheetName,
      headers: sheet.headers,
      mapping: activeMapping,
      inferredMapping,
      rowCount: sheet.rows.length,
      drafts: result.drafts.map((draft, index) => {
        const duplicateKey = buildDraftDuplicateKey(draft);
        const firstFileRowIndex = fileKeys.get(duplicateKey);
        const existingBatchId = existingKeys.get(duplicateKey);
        const duplicate = existingBatchId
          ? {
              kind: "database",
              existingBatchId,
              message: "Matches an existing nursery batch.",
            }
          : firstFileRowIndex !== undefined
            ? {
                kind: "file",
                firstRowNumber: firstFileRowIndex + 2,
                message: `Matches row ${firstFileRowIndex + 2} in this file.`,
              }
            : undefined;

        if (firstFileRowIndex === undefined) {
          fileKeys.set(duplicateKey, index);
        }

        return {
          ...draft,
          datePlanted: draft.datePlanted.toISOString(),
          duplicate,
          contract: draft.contract
            ? {
                ...draft.contract,
                targetShipDate: draft.contract.targetShipDate.toISOString(),
              }
            : undefined,
        };
      }),
      errors: result.errors,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to parse spreadsheet.",
      },
      { status: 400 },
    );
  }
}
