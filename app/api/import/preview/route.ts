import { NextResponse } from "next/server";

import {
  buildImportDrafts,
  inferColumnMapping,
  parseSpreadsheetBuffer,
  type ImportColumnMapping,
} from "@/lib/domain/importer";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

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

    return NextResponse.json({
      fileName: sheet.fileName,
      sheetName: sheet.sheetName,
      headers: sheet.headers,
      mapping: activeMapping,
      inferredMapping,
      rowCount: sheet.rows.length,
      drafts: result.drafts.map((draft) => ({
        ...draft,
        datePlanted: draft.datePlanted.toISOString(),
        contract: draft.contract
          ? {
              ...draft.contract,
              targetShipDate: draft.contract.targetShipDate.toISOString(),
            }
          : undefined,
      })),
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
