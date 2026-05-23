import Papa from "papaparse";
import { z } from "zod";
import { readSheet } from "read-excel-file/node";

export type ImportField =
  | "species"
  | "cultivar"
  | "quantity"
  | "location"
  | "infrastructureType"
  | "datePlanted"
  | "status"
  | "manualShockFactor"
  | "contractRef"
  | "committedQuantity"
  | "targetShipDate";

export type ImportColumnMapping = Partial<Record<ImportField, string>>;

export type ParsedSheet = {
  fileName: string;
  sheetName: string;
  headers: string[];
  rows: Array<Record<string, unknown>>;
};

export type BatchImportDraft = {
  speciesName: string;
  cultivarName: string;
  quantity: number;
  fieldLocation: string;
  infrastructureType: string;
  datePlanted: Date;
  status: string;
  manualShockFactor: number;
  contract?: {
    externalRef: string;
    committedQuantity: number;
    targetShipDate: Date;
  };
};

export type ImportDraftResult = {
  drafts: BatchImportDraft[];
  errors: Array<{
    rowNumber: number;
    message: string;
  }>;
};

const rowSchema = z.object({
  speciesName: z.string().min(1),
  cultivarName: z.string().min(1),
  quantity: z.number().int().positive(),
  fieldLocation: z.string().min(1),
  infrastructureType: z.string().min(1),
  datePlanted: z.date(),
  status: z.string().min(1),
  manualShockFactor: z.number().min(0).max(1),
  contract: z
    .object({
      externalRef: z.string().min(1),
      committedQuantity: z.number().int().positive(),
      targetShipDate: z.date(),
    })
    .optional(),
});

const headerSynonyms: Record<ImportField, string[]> = {
  species: [
    "species",
    "tree type",
    "crop name",
    "botanical group",
    "item",
    "plant species",
  ],
  cultivar: [
    "cultivar",
    "variety",
    "named variety",
    "plant variety",
    "cultivar name",
  ],
  quantity: [
    "quantity on hand",
    "quantity",
    "total plugs",
    "stock count",
    "units started",
    "tray count",
  ],
  location: [
    "block",
    "bench",
    "yard location",
    "location code",
    "growing area",
    "field location",
  ],
  infrastructureType: [
    "production system",
    "growing environment",
    "infra type",
    "structure",
    "house type",
    "infrastructure type",
  ],
  datePlanted: [
    "planted on",
    "start date",
    "date started",
    "planting date",
    "seeded",
    "date planted",
  ],
  status: ["status", "batch status", "batch state", "current status", "stage"],
  manualShockFactor: [
    "manual shock",
    "shock adjustment",
    "weather shock",
    "shock factor",
    "loss override",
    "manual shock factor",
  ],
  contractRef: [
    "contract id",
    "buyer ref",
    "order number",
    "contract ref",
    "po",
    "external ref",
  ],
  committedQuantity: [
    "committed qty",
    "reserved units",
    "order qty",
    "committed",
    "promise qty",
    "committed quantity",
  ],
  targetShipDate: [
    "ship target",
    "ready by",
    "target date",
    "ship date",
    "ready week",
    "target ship date",
  ],
};

export function parseCsvSheet(fileName: string, csvText: string): ParsedSheet {
  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors.map((error) => error.message).join("; "));
  }

  return {
    fileName,
    sheetName: "CSV",
    headers: parsed.meta.fields ?? [],
    rows: parsed.data,
  };
}

export async function parseSpreadsheetBuffer(fileName: string, buffer: Buffer) {
  if (fileName.toLowerCase().endsWith(".csv")) {
    return parseCsvSheet(fileName, buffer.toString("utf8"));
  }

  if (fileName.toLowerCase().endsWith(".xlsx")) {
    return parseXlsxSheet(fileName, buffer);
  }

  throw new Error("Only CSV and XLSX files are supported.");
}

export async function parseXlsxSheet(fileName: string, buffer: Buffer): Promise<ParsedSheet> {
  const matrix = await readSheet(buffer);
  const headerRow = matrix[1] ?? matrix[0] ?? [];
  const headers = headerRow.map((value) => String(value ?? "").trim()).filter(Boolean);

  if (headers.length === 0) {
    throw new Error("Workbook does not contain a header row.");
  }

  const rows = matrix.slice(2).flatMap((row): ParsedSheet["rows"] => {
    const record = Object.fromEntries(
      headers.map((header, index) => [header, normalizeExcelCell(row[index])]),
    );
    return Object.values(record).some((value) => String(value ?? "").trim() !== "")
      ? [record]
      : [];
  });

  return {
    fileName,
    sheetName: "Workbook",
    headers,
    rows,
  };
}

export function inferColumnMapping(headers: string[]): ImportColumnMapping {
  const normalizedHeaders = new Map(
    headers.map((header) => [normalizeHeader(header), header] as const),
  );

  return Object.fromEntries(
    Object.entries(headerSynonyms).flatMap(([field, synonyms]) => {
      const match = synonyms.find((synonym) => normalizedHeaders.has(normalizeHeader(synonym)));
      return match ? [[field, normalizedHeaders.get(normalizeHeader(match))]] : [];
    }),
  ) as ImportColumnMapping;
}

export function buildImportDrafts(
  sheet: ParsedSheet,
  mapping: ImportColumnMapping = inferColumnMapping(sheet.headers),
): ImportDraftResult {
  const drafts: BatchImportDraft[] = [];
  const errors: ImportDraftResult["errors"] = [];

  sheet.rows.forEach((row, index) => {
    try {
      const draft = rowSchema.parse({
        speciesName: normalizeTitleCase(readRequired(row, mapping.species, "species")),
        cultivarName: normalizeTitleCase(readRequired(row, mapping.cultivar, "cultivar")),
        quantity: parsePositiveInteger(readRequired(row, mapping.quantity, "quantity")),
        fieldLocation: normalizeWhitespace(readRequired(row, mapping.location, "location")),
        infrastructureType: normalizeEnumLike(
          readRequired(row, mapping.infrastructureType, "infrastructure type"),
        ),
        datePlanted: parseDateValue(readRequired(row, mapping.datePlanted, "date planted")),
        status: normalizeEnumLike(readOptional(row, mapping.status) || "IN_PRODUCTION"),
        manualShockFactor: parseRate(readOptional(row, mapping.manualShockFactor) || 0),
        contract: buildContractDraft(row, mapping),
      });

      drafts.push(draft);
    } catch (error) {
      errors.push({
        rowNumber: index + 2,
        message: error instanceof Error ? error.message : "Invalid row.",
      });
    }
  });

  return {
    drafts,
    errors,
  };
}

export function normalizeTitleCase(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

export function normalizeHeader(value: string) {
  return normalizeWhitespace(value).toLowerCase().replace(/[_-]+/g, " ");
}

function normalizeWhitespace(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeEnumLike(value: unknown) {
  return normalizeWhitespace(value).toUpperCase().replace(/[\s-]+/g, "_");
}

function readRequired(
  row: Record<string, unknown>,
  columnName: string | undefined,
  fieldName: string,
) {
  const value = readOptional(row, columnName);

  if (value === "") {
    throw new Error(`Missing ${fieldName}.`);
  }

  return value;
}

function readOptional(row: Record<string, unknown>, columnName: string | undefined) {
  if (!columnName) {
    return "";
  }

  return normalizeWhitespace(row[columnName]);
}

function parsePositiveInteger(value: unknown) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Expected positive integer, received ${value}.`);
  }

  return parsed;
}

function parseRate(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Expected numeric shock factor, received ${value}.`);
  }

  return Math.min(Math.max(parsed, 0), 1);
}

function parseDateValue(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const parsed = new Date(String(value));

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Expected date, received ${value}.`);
  }

  return parsed;
}

function buildContractDraft(
  row: Record<string, unknown>,
  mapping: ImportColumnMapping,
): BatchImportDraft["contract"] {
  const externalRef = readOptional(row, mapping.contractRef);
  const committedQuantityValue = readOptional(row, mapping.committedQuantity);

  if (!externalRef || !committedQuantityValue || Number(committedQuantityValue) <= 0) {
    return undefined;
  }

  return {
    externalRef,
    committedQuantity: parsePositiveInteger(committedQuantityValue),
    targetShipDate: parseDateValue(readRequired(row, mapping.targetShipDate, "target ship date")),
  };
}

function normalizeExcelCell(value: unknown) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "object" && value && "result" in value) {
    return value.result;
  }

  if (typeof value === "object" && value && "text" in value) {
    return value.text;
  }

  return value ?? "";
}
