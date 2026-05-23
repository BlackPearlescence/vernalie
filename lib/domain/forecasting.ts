export type LifecycleType =
  | "MULTI_YEAR_PERENNIAL"
  | "PROPAGATION_RUNNER"
  | "RAPID_ANNUAL";

export type InfrastructureType =
  | "HIGH_TECH_GREENHOUSE"
  | "GREENHOUSE"
  | "SHADE_HOUSE"
  | "HOOP_HOUSE"
  | "OPEN_FIELD";

export type ForecastRiskCode =
  | "COLD_ZONE_FAILURE"
  | "COLD_ZONE_PENALTY"
  | "MANUAL_SHOCK"
  | "HIGH_LOSS_RATE"
  | "LOW_PROJECTED_YIELD";

export type ForecastRisk = {
  code: ForecastRiskCode;
  message: string;
  severity: "info" | "warning" | "danger";
};

export type ForecastMonth = {
  monthIndex: number;
  date: Date;
  projectedQuantity: number;
  isReadyMonth: boolean;
};

export type ForecastBatchInput = {
  id: string;
  nurseryUsdaZone: number;
  lifecycleType: LifecycleType;
  startingQuantity: number;
  currentQuantity?: number;
  baseLossRate: number;
  decayModifier: number;
  minSurvivalZone: number;
  weeksToHarvest: number;
  infrastructureType: InfrastructureType;
  manualShockFactor?: number;
  datePlanted: Date;
  horizonMonths?: number;
  propagationMonthlyMultiplier?: number;
};

export type ForecastResult = {
  batchId: string;
  projectedYield: number;
  estimatedReadyDate: Date;
  timeline: ForecastMonth[];
  risks: ForecastRisk[];
};

const DEFAULT_HORIZON_MONTHS = 36;
const DEFAULT_PROPAGATION_MONTHLY_MULTIPLIER = 1.08;
const OPEN_FIELD_COLD_ZONE_MONTHLY_PENALTY = 0.025;
const HIGH_LOSS_RATE_THRESHOLD = 0.18;
const LOW_YIELD_RATIO_THRESHOLD = 0.7;

export function forecastBatch(input: ForecastBatchInput): ForecastResult {
  assertValidBatchInput(input);

  const horizonMonths = input.horizonMonths ?? DEFAULT_HORIZON_MONTHS;
  const readyMonthIndex = Math.max(0, Math.ceil(input.weeksToHarvest / 4.345));
  const estimatedReadyDate = addWeeks(input.datePlanted, input.weeksToHarvest);
  const risks: ForecastRisk[] = [];
  const effectiveLossRate = clampRate(input.baseLossRate + input.decayModifier);
  const manualShockFactor = clampRate(input.manualShockFactor ?? 0);
  const coldZoneDelta = input.minSurvivalZone - input.nurseryUsdaZone;
  const isOpenFieldColdMismatch =
    input.infrastructureType === "OPEN_FIELD" && coldZoneDelta > 0;

  if (manualShockFactor > 0) {
    risks.push({
      code: "MANUAL_SHOCK",
      severity: manualShockFactor >= 0.2 ? "danger" : "warning",
      message: `Manual shock reduced the forecast by ${formatPercent(manualShockFactor)}.`,
    });
  }

  if (effectiveLossRate >= HIGH_LOSS_RATE_THRESHOLD) {
    risks.push({
      code: "HIGH_LOSS_RATE",
      severity: "warning",
      message: `Combined loss rate is ${formatPercent(effectiveLossRate)}.`,
    });
  }

  const timeline: ForecastMonth[] = [];

  if (isOpenFieldColdMismatch && coldZoneDelta >= 2) {
    risks.push({
      code: "COLD_ZONE_FAILURE",
      severity: "danger",
      message:
        "Open-field batch is planted more than one USDA zone below cultivar survival guidance.",
    });

    for (let monthIndex = 0; monthIndex <= horizonMonths; monthIndex += 1) {
      timeline.push({
        monthIndex,
        date: addMonths(input.datePlanted, monthIndex),
        projectedQuantity: 0,
        isReadyMonth: monthIndex === readyMonthIndex,
      });
    }

    return {
      batchId: input.id,
      projectedYield: 0,
      estimatedReadyDate,
      timeline,
      risks,
    };
  }

  if (isOpenFieldColdMismatch) {
    risks.push({
      code: "COLD_ZONE_PENALTY",
      severity: "warning",
      message:
        "Open-field batch is below cultivar survival guidance and receives a monthly cold-zone penalty.",
    });
  }

  for (let monthIndex = 0; monthIndex <= horizonMonths; monthIndex += 1) {
    timeline.push({
      monthIndex,
      date: addMonths(input.datePlanted, monthIndex),
      projectedQuantity: calculateQuantityForMonth({
        ...input,
        effectiveLossRate,
        manualShockFactor,
        coldZoneDelta,
        monthIndex,
        readyMonthIndex,
      }),
      isReadyMonth: monthIndex === readyMonthIndex,
    });
  }

  const readyMonth = timeline.find((month) => month.isReadyMonth) ?? timeline.at(-1);
  const projectedYield = readyMonth?.projectedQuantity ?? 0;

  if (projectedYield / input.startingQuantity < LOW_YIELD_RATIO_THRESHOLD) {
    risks.push({
      code: "LOW_PROJECTED_YIELD",
      severity: projectedYield === 0 ? "danger" : "warning",
      message: `Projected yield is ${projectedYield} from ${input.startingQuantity} starting units.`,
    });
  }

  return {
    batchId: input.id,
    projectedYield,
    estimatedReadyDate,
    timeline,
    risks,
  };
}

export function forecastBatches(inputs: ForecastBatchInput[]) {
  return inputs.map(forecastBatch);
}

function calculateQuantityForMonth(
  input: ForecastBatchInput & {
    effectiveLossRate: number;
    manualShockFactor: number;
    coldZoneDelta: number;
    monthIndex: number;
    readyMonthIndex: number;
  },
) {
  const currentQuantity = input.currentQuantity ?? input.startingQuantity;

  if (input.lifecycleType === "RAPID_ANNUAL") {
    const harvestQuantity = currentQuantity * (1 - input.effectiveLossRate);
    const shockedQuantity = harvestQuantity * (1 - input.manualShockFactor);
    return input.monthIndex < input.readyMonthIndex
      ? currentQuantity
      : roundWholeUnits(shockedQuantity);
  }

  if (input.lifecycleType === "PROPAGATION_RUNNER") {
    const multiplier =
      input.propagationMonthlyMultiplier ?? DEFAULT_PROPAGATION_MONTHLY_MULTIPLIER;
    const grownQuantity = currentQuantity * multiplier ** input.monthIndex;
    const monthlyLossRate = input.effectiveLossRate / 12;
    const survivedQuantity = grownQuantity * (1 - monthlyLossRate) ** input.monthIndex;
    const shockedQuantity = survivedQuantity * (1 - input.manualShockFactor);
    return roundWholeUnits(shockedQuantity);
  }

  const monthlyLossRate =
    input.effectiveLossRate / 12 +
    Math.max(0, input.coldZoneDelta) * OPEN_FIELD_COLD_ZONE_MONTHLY_PENALTY;
  const survivedQuantity = currentQuantity * (1 - clampRate(monthlyLossRate)) ** input.monthIndex;
  const shockedQuantity = survivedQuantity * (1 - input.manualShockFactor);

  return roundWholeUnits(shockedQuantity);
}

function assertValidBatchInput(input: ForecastBatchInput) {
  if (!Number.isInteger(input.startingQuantity) || input.startingQuantity <= 0) {
    throw new Error("startingQuantity must be a positive integer.");
  }

  if (
    input.currentQuantity !== undefined &&
    (!Number.isInteger(input.currentQuantity) || input.currentQuantity < 0)
  ) {
    throw new Error("currentQuantity must be a non-negative integer.");
  }

  if (!Number.isInteger(input.weeksToHarvest) || input.weeksToHarvest < 0) {
    throw new Error("weeksToHarvest must be a non-negative integer.");
  }

  if (!Number.isInteger(input.nurseryUsdaZone) || input.nurseryUsdaZone < 1) {
    throw new Error("nurseryUsdaZone must be a positive integer.");
  }

  if (!Number.isInteger(input.minSurvivalZone) || input.minSurvivalZone < 1) {
    throw new Error("minSurvivalZone must be a positive integer.");
  }

  if (input.horizonMonths !== undefined && input.horizonMonths < 1) {
    throw new Error("horizonMonths must be at least 1.");
  }
}

function addWeeks(date: Date, weeks: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + weeks * 7);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function clampRate(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1);
}

function roundWholeUnits(value: number) {
  return Math.max(0, Math.floor(value));
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
