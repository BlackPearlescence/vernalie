import { describe, expect, it } from "vitest";

import { forecastBatch, forecastBatches, type ForecastBatchInput } from "./forecasting";

const baseAppleBatch: ForecastBatchInput = {
  id: "batch-apple-honeycrisp",
  nurseryUsdaZone: 6,
  lifecycleType: "MULTI_YEAR_PERENNIAL",
  startingQuantity: 1000,
  baseLossRate: 0.08,
  decayModifier: 0.02,
  minSurvivalZone: 5,
  weeksToHarvest: 52,
  infrastructureType: "OPEN_FIELD",
  datePlanted: new Date("2026-01-01T00:00:00.000Z"),
};

describe("forecastBatch", () => {
  it("compounds monthly decay for multi-year perennials", () => {
    const forecast = forecastBatch(baseAppleBatch);

    expect(forecast.projectedYield).toBe(904);
    expect(forecast.timeline).toHaveLength(37);
    expect(forecast.timeline[0].projectedQuantity).toBe(1000);
    expect(forecast.timeline[12].projectedQuantity).toBe(904);
  });

  it("drops open-field batches to zero when planted far below survival guidance", () => {
    const forecast = forecastBatch({
      ...baseAppleBatch,
      nurseryUsdaZone: 3,
      minSurvivalZone: 5,
    });

    expect(forecast.projectedYield).toBe(0);
    expect(forecast.timeline.every((month) => month.projectedQuantity === 0)).toBe(true);
    expect(forecast.risks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "COLD_ZONE_FAILURE", severity: "danger" }),
      ]),
    );
  });

  it("applies a one-time harvest loss for rapid annuals", () => {
    const forecast = forecastBatch({
      ...baseAppleBatch,
      lifecycleType: "RAPID_ANNUAL",
      startingQuantity: 5000,
      baseLossRate: 0.14,
      decayModifier: 0,
      weeksToHarvest: 10,
      infrastructureType: "GREENHOUSE",
    });

    expect(forecast.timeline[0].projectedQuantity).toBe(5000);
    expect(forecast.timeline[2].projectedQuantity).toBe(5000);
    expect(forecast.projectedYield).toBe(4300);
  });

  it("applies manual shock as an immediate subtractive factor", () => {
    const noShock = forecastBatch(baseAppleBatch);
    const shocked = forecastBatch({
      ...baseAppleBatch,
      manualShockFactor: 0.12,
    });

    expect(shocked.projectedYield).toBeLessThan(noShock.projectedYield);
    expect(shocked.projectedYield).toBe(795);
    expect(shocked.risks).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "MANUAL_SHOCK" })]),
    );
  });

  it("supports deterministic propagation runner multiplication", () => {
    const forecast = forecastBatch({
      ...baseAppleBatch,
      lifecycleType: "PROPAGATION_RUNNER",
      startingQuantity: 200,
      baseLossRate: 0.06,
      decayModifier: 0,
      weeksToHarvest: 16,
      infrastructureType: "GREENHOUSE",
      propagationMonthlyMultiplier: 1.15,
    });

    expect(forecast.projectedYield).toBe(342);
    expect(forecast.timeline[4].projectedQuantity).toBe(342);
  });

  it("forecasts an array of batches", () => {
    const forecasts = forecastBatches([
      baseAppleBatch,
      { ...baseAppleBatch, id: "batch-apple-gala", startingQuantity: 750 },
    ]);

    expect(forecasts.map((forecast) => forecast.batchId)).toEqual([
      "batch-apple-honeycrisp",
      "batch-apple-gala",
    ]);
  });

  it("rejects invalid starting quantities", () => {
    expect(() =>
      forecastBatch({
        ...baseAppleBatch,
        startingQuantity: 0,
      }),
    ).toThrow("startingQuantity must be a positive integer.");
  });
});
