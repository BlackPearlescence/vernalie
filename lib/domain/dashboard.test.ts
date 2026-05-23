import { describe, expect, it } from "vitest";

import {
  buildDashboardReadModel,
  type ContractCommitmentInput,
  type DashboardBatchInput,
} from "./dashboard";

const batches: DashboardBatchInput[] = [
  {
    id: "batch-honeycrisp",
    genusName: "Malus domestica",
    categoryLabel: "Pome Fruits",
    cultivarName: "Honeycrisp",
    nurseryUsdaZone: 6,
    lifecycleType: "MULTI_YEAR_PERENNIAL",
    startingQuantity: 1000,
    baseLossRate: 0.08,
    decayModifier: 0.02,
    minSurvivalZone: 5,
    weeksToHarvest: 52,
    infrastructureType: "OPEN_FIELD",
    datePlanted: new Date("2026-01-01T00:00:00.000Z"),
    fieldLocation: "Block A",
    status: "IN_PRODUCTION",
  },
  {
    id: "batch-fuji",
    genusName: "Malus domestica",
    categoryLabel: "Pome Fruits",
    cultivarName: "Fuji",
    nurseryUsdaZone: 4,
    lifecycleType: "MULTI_YEAR_PERENNIAL",
    startingQuantity: 1000,
    baseLossRate: 0.08,
    decayModifier: 0.03,
    minSurvivalZone: 6,
    weeksToHarvest: 60,
    infrastructureType: "OPEN_FIELD",
    datePlanted: new Date("2026-01-01T00:00:00.000Z"),
    fieldLocation: "Block B",
    status: "IN_PRODUCTION",
  },
  {
    id: "batch-tomato",
    genusName: "Solanum lycopersicum",
    categoryLabel: "Greenhouse Plugs",
    cultivarName: "Roma",
    nurseryUsdaZone: 6,
    lifecycleType: "RAPID_ANNUAL",
    startingQuantity: 5000,
    baseLossRate: 0.14,
    decayModifier: 0,
    minSurvivalZone: 3,
    weeksToHarvest: 10,
    infrastructureType: "GREENHOUSE",
    datePlanted: new Date("2026-02-01T00:00:00.000Z"),
    fieldLocation: "Greenhouse 2",
    status: "IN_PRODUCTION",
  },
  {
    id: "batch-culled",
    genusName: "Prunus persica",
    categoryLabel: "Stone Fruits",
    cultivarName: "Reliance",
    nurseryUsdaZone: 6,
    lifecycleType: "MULTI_YEAR_PERENNIAL",
    startingQuantity: 900,
    baseLossRate: 0.08,
    decayModifier: 0.01,
    minSurvivalZone: 5,
    weeksToHarvest: 52,
    infrastructureType: "OPEN_FIELD",
    datePlanted: new Date("2026-01-01T00:00:00.000Z"),
    fieldLocation: "Block C",
    status: "CULLED",
  },
];

const commitments: ContractCommitmentInput[] = [
  {
    id: "commitment-1",
    batchId: "batch-honeycrisp",
    externalRef: "Contract #INV-882",
    committedQuantity: 950,
    targetShipDate: new Date("2027-03-15T00:00:00.000Z"),
  },
  {
    id: "commitment-2",
    batchId: "batch-tomato",
    externalRef: "Contract #INV-121",
    committedQuantity: 4000,
    targetShipDate: new Date("2026-04-15T00:00:00.000Z"),
  },
];

describe("buildDashboardReadModel", () => {
  it("summarizes active inventory totals", () => {
    const dashboard = buildDashboardReadModel({ batches, commitments });

    expect(dashboard.totals).toEqual({
      activeBatchCount: 3,
      startingQuantity: 7000,
      projectedYield: 5204,
      deficitAlertCount: 1,
      threatBatchCount: 1,
    });
  });

  it("creates deficit alerts when commitments exceed projected yield", () => {
    const dashboard = buildDashboardReadModel({ batches, commitments });

    expect(dashboard.deficitAlerts).toEqual([
      expect.objectContaining({
        batchId: "batch-honeycrisp",
        cultivarName: "Honeycrisp",
        externalRef: "Contract #INV-882",
        committedQuantity: 950,
        projectedYield: 904,
        deficitUnits: 46,
        severity: "warning",
        message: "DEFICIT WARNING: -46 UNITS Contract #INV-882 compromised",
      }),
    ]);
  });

  it("groups inventory summaries by genus", () => {
    const dashboard = buildDashboardReadModel({ batches, commitments });

    expect(dashboard.genusSummaries).toEqual([
      {
        genusName: "Solanum lycopersicum",
        categoryLabel: "Greenhouse Plugs",
        batchCount: 1,
        startingQuantity: 5000,
        projectedYield: 4300,
        riskLevel: "clear",
      },
      {
        genusName: "Malus domestica",
        categoryLabel: "Pome Fruits",
        batchCount: 2,
        startingQuantity: 2000,
        projectedYield: 904,
        riskLevel: "threat",
      },
    ]);
  });

  it("buckets projected yield by shipping season", () => {
    const dashboard = buildDashboardReadModel({ batches, commitments });

    expect(dashboard.seasonalAvailability).toEqual([
      {
        season: "Spring 2026",
        startsAt: new Date("2026-03-01T00:00:00.000Z"),
        projectedYield: 4300,
        batchCount: 1,
      },
      {
        season: "Winter 2026",
        startsAt: new Date("2026-12-01T00:00:00.000Z"),
        projectedYield: 904,
        batchCount: 1,
      },
    ]);
  });
});
