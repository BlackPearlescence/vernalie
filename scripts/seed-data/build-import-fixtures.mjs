import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";
import fs from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve("seed-data/import-fixtures");

const workbooks = [
  {
    fileName: "northern-rootstock-mixed.xlsx",
    sheetName: "Spring Inventory",
    title: "Northern Rootstock Cooperative - Spring Inventory",
    headers: [
      "Species",
      "Named Variety",
      "Units Started",
      "Location Code",
      "Structure",
      "Planting Date",
      "Batch Status",
      "Shock Factor",
      "Contract Ref",
      "Committed",
      "Ship Date",
    ],
    rows: [
      ["Apple", "Liberty", 900, "NR-A1", "OPEN_FIELD", new Date("2026-01-12"), "IN_PRODUCTION", 0.01, "NRC-400", 760, new Date("2027-03-25")],
      ["Apple", "Enterprise", 820, "NR-A2", "OPEN_FIELD", new Date("2026-01-14"), "IN_PRODUCTION", 0.02, "NRC-401", 700, new Date("2027-03-25")],
      ["Cherry", "Montmorency", 650, "NR-C1", "OPEN_FIELD", new Date("2026-02-01"), "IN_PRODUCTION", 0.03, "NRC-402", 560, new Date("2027-04-20")],
      ["Blueberry", "Bluecrop", 1200, "NR-B4", "SHADE_HOUSE", new Date("2026-02-15"), "IN_PRODUCTION", 0, "NRC-403", 950, new Date("2027-05-05")],
      ["Strawberry", "Albion", 2500, "Runner Bay 1", "GREENHOUSE", new Date("2026-03-01"), "IN_PRODUCTION", 0, "NRC-404", 2200, new Date("2026-06-15")],
      ["Raspberry", "Heritage", 1400, "Cane Row 3", "OPEN_FIELD", new Date("2026-03-05"), "ON_HOLD", 0.05, "", 0, new Date("2027-05-20")],
    ],
  },
  {
    fileName: "suncrest-annuals-plugs.xlsx",
    sheetName: "Plug Runs",
    title: "Suncrest Plug Farm - Annuals and Bedding Plants",
    headers: [
      "Item",
      "Cultivar Name",
      "Tray Count",
      "Growing Area",
      "House Type",
      "Seeded",
      "Stage",
      "Loss Override",
      "PO",
      "Promise Qty",
      "Ready Week",
    ],
    rows: [
      ["Marigold", "Inca II Orange", 6400, "House 1 Bench A", "HIGH_TECH_GREENHOUSE", new Date("2026-03-04"), "IN_PRODUCTION", 0, "PO-771", 5800, new Date("2026-05-01")],
      ["Petunia", "Supertunia Vista Bubblegum", 5200, "House 1 Bench B", "HIGH_TECH_GREENHOUSE", new Date("2026-03-06"), "IN_PRODUCTION", 0.01, "PO-772", 4600, new Date("2026-05-10")],
      ["Zinnia", "Benary Giant Mix", 4800, "House 2 Bench C", "GREENHOUSE", new Date("2026-03-10"), "IN_PRODUCTION", 0, "PO-773", 4200, new Date("2026-05-15")],
      ["Pansy", "Matrix Blue Blotch", 3600, "House 2 Bench D", "GREENHOUSE", new Date("2026-02-15"), "READY_TO_SHIP", 0, "PO-774", 3200, new Date("2026-04-10")],
      ["Salvia", "Victoria Blue", 3100, "House 3 Bench A", "GREENHOUSE", new Date("2026-03-12"), "IN_PRODUCTION", 0.02, "PO-775", 2600, new Date("2026-05-20")],
      ["Geranium", "Maverick Red", 2800, "House 3 Bench B", "GREENHOUSE", new Date("2026-02-25"), "IN_PRODUCTION", 0, "", 0, new Date("2026-05-05")],
    ],
  },
];

await fs.mkdir(outputDir, { recursive: true });

for (const spec of workbooks) {
  const workbook = Workbook.create();
  const sheet = workbook.worksheets.add(spec.sheetName);
  const columnCount = spec.headers.length;
  const lastColumn = String.fromCharCode("A".charCodeAt(0) + columnCount - 1);

  sheet.getRange(`A1:${lastColumn}1`).values = [[spec.title, ...Array(columnCount - 1).fill(null)]];
  sheet.getRange(`A2:${lastColumn}2`).values = [spec.headers];
  sheet.getRange(`A3:${lastColumn}${spec.rows.length + 2}`).values = spec.rows;

  sheet.getRange(`A1:${lastColumn}1`).format.font.bold = true;
  sheet.getRange(`A1:${lastColumn}1`).format.font.size = 14;
  sheet.getRange(`A2:${lastColumn}2`).format.font.bold = true;
  sheet.getRange(`A2:${lastColumn}2`).format.fill.color = "#eef1e8";
  sheet.getRange(`F3:F${spec.rows.length + 2}`).format.numberFormat = "yyyy-mm-dd";
  sheet.getRange(`K3:K${spec.rows.length + 2}`).format.numberFormat = "yyyy-mm-dd";

  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(path.join(outputDir, spec.fileName));
}
