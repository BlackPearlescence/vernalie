import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildImportDrafts,
  inferColumnMapping,
  normalizeTitleCase,
  parseCsvSheet,
  parseSpreadsheetBuffer,
} from "./importer";

const fixtureDir = path.join(process.cwd(), "seed-data", "import-fixtures");

describe("importer utilities", () => {
  it("normalizes messy cultivar text to title case", () => {
    expect(normalizeTitleCase(" granny smith ")).toBe("Granny Smith");
    expect(normalizeTitleCase("POWWOW wild berry")).toBe("Powwow Wild Berry");
  });

  it("infers mappings and drafts fruit tree CSV rows", async () => {
    const fileName = "green-valley-fruit-trees.csv";
    const csv = await readFile(path.join(fixtureDir, fileName), "utf8");
    const sheet = parseCsvSheet(fileName, csv);
    const mapping = inferColumnMapping(sheet.headers);
    const result = buildImportDrafts(sheet, mapping);

    expect(mapping).toMatchObject({
      species: "Tree_Type",
      cultivar: "Cultivar",
      quantity: "Quantity_On_Hand",
      contractRef: "Contract_ID",
    });
    expect(result.errors).toEqual([]);
    expect(result.drafts).toHaveLength(6);
    expect(result.drafts[0]).toMatchObject({
      speciesName: "Apple",
      cultivarName: "Honeycrisp",
      quantity: 1000,
      infrastructureType: "OPEN_FIELD",
      contract: {
        externalRef: "INV-882",
        committedQuantity: 925,
      },
    });
  });

  it("parses every CSV fixture into valid drafts", async () => {
    for (const fileName of [
      "green-valley-fruit-trees.csv",
      "riverbend-greenhouse-vegetables.csv",
      "meadowbrook-herbs-perennials.csv",
    ]) {
      const csv = await readFile(path.join(fixtureDir, fileName), "utf8");
      const result = buildImportDrafts(parseCsvSheet(fileName, csv));

      expect(result.errors, fileName).toEqual([]);
      expect(result.drafts, fileName).toHaveLength(6);
    }
  });

  it("parses every XLSX fixture into valid drafts", async () => {
    for (const fileName of [
      "northern-rootstock-mixed.xlsx",
      "suncrest-annuals-plugs.xlsx",
    ]) {
      const buffer = await readFile(path.join(fixtureDir, fileName));
      const sheet = await parseSpreadsheetBuffer(fileName, buffer);
      const result = buildImportDrafts(sheet);

      expect(sheet.headers.length, fileName).toBeGreaterThan(0);
      expect(result.errors, fileName).toEqual([]);
      expect(result.drafts, fileName).toHaveLength(6);
    }
  });

  it("reports row-level errors for missing required fields", () => {
    const sheet = parseCsvSheet(
      "bad.csv",
      "Species,Cultivar,Quantity,Location,Infrastructure Type,Date Planted\nApple,,100,Block A,OPEN_FIELD,2026-01-01",
    );
    const result = buildImportDrafts(sheet);

    expect(result.drafts).toEqual([]);
    expect(result.errors).toEqual([
      expect.objectContaining({
        rowNumber: 2,
      }),
    ]);
  });
});
