import { forecastBatch, type ForecastBatchInput, type ForecastResult } from "./forecasting";

export type ContractCommitmentInput = {
  id: string;
  batchId: string;
  externalRef: string;
  committedQuantity: number;
  targetShipDate: Date;
};

export type DashboardBatchInput = ForecastBatchInput & {
  genusName: string;
  cultivarName: string;
  categoryLabel?: string;
  fieldLocation: string;
  status: "IN_PRODUCTION" | "READY_TO_SHIP" | "ON_HOLD" | "CULLED";
};

export type DeficitAlert = {
  batchId: string;
  cultivarName: string;
  externalRef: string;
  committedQuantity: number;
  projectedYield: number;
  deficitUnits: number;
  targetShipDate: Date;
  severity: "warning" | "danger";
  message: string;
};

export type GenusSummary = {
  genusName: string;
  categoryLabel: string;
  batchCount: number;
  startingQuantity: number;
  projectedYield: number;
  riskLevel: "clear" | "watch" | "threat";
};

export type SeasonalAvailability = {
  season: string;
  startsAt: Date;
  projectedYield: number;
  batchCount: number;
};

export type DashboardReadModel = {
  totals: {
    activeBatchCount: number;
    startingQuantity: number;
    projectedYield: number;
    deficitAlertCount: number;
    threatBatchCount: number;
  };
  deficitAlerts: DeficitAlert[];
  genusSummaries: GenusSummary[];
  seasonalAvailability: SeasonalAvailability[];
  forecasts: ForecastResult[];
};

type DashboardBuildInput = {
  batches: DashboardBatchInput[];
  commitments?: ContractCommitmentInput[];
};

export function buildDashboardReadModel({
  batches,
  commitments = [],
}: DashboardBuildInput): DashboardReadModel {
  const activeBatches = batches.filter((batch) => batch.status !== "CULLED");
  const forecasts = activeBatches.map(forecastBatch);
  const forecastByBatchId = new Map(forecasts.map((forecast) => [forecast.batchId, forecast]));
  const batchById = new Map(activeBatches.map((batch) => [batch.id, batch]));
  const deficitAlerts = buildDeficitAlerts({
    commitments,
    forecastByBatchId,
    batchById,
  });

  return {
    totals: {
      activeBatchCount: activeBatches.length,
      startingQuantity: sum(activeBatches.map((batch) => batch.startingQuantity)),
      projectedYield: sum(forecasts.map((forecast) => forecast.projectedYield)),
      deficitAlertCount: deficitAlerts.length,
      threatBatchCount: forecasts.filter((forecast) =>
        forecast.risks.some((risk) => risk.severity === "danger"),
      ).length,
    },
    deficitAlerts,
    genusSummaries: buildGenusSummaries(activeBatches, forecastByBatchId),
    seasonalAvailability: buildSeasonalAvailability(activeBatches, forecastByBatchId),
    forecasts,
  };
}

function buildDeficitAlerts({
  commitments,
  forecastByBatchId,
  batchById,
}: {
  commitments: ContractCommitmentInput[];
  forecastByBatchId: Map<string, ForecastResult>;
  batchById: Map<string, DashboardBatchInput>;
}) {
  return commitments.flatMap((commitment): DeficitAlert[] => {
    const forecast = forecastByBatchId.get(commitment.batchId);
    const batch = batchById.get(commitment.batchId);

    if (!forecast || !batch || forecast.projectedYield >= commitment.committedQuantity) {
      return [];
    }

    const deficitUnits = commitment.committedQuantity - forecast.projectedYield;

    return [
      {
        batchId: commitment.batchId,
        cultivarName: batch.cultivarName,
        externalRef: commitment.externalRef,
        committedQuantity: commitment.committedQuantity,
        projectedYield: forecast.projectedYield,
        deficitUnits,
        targetShipDate: commitment.targetShipDate,
        severity: deficitUnits >= commitment.committedQuantity * 0.2 ? "danger" : "warning",
        message: `DEFICIT WARNING: -${deficitUnits} UNITS ${commitment.externalRef} compromised`,
      },
    ];
  });
}

function buildGenusSummaries(
  batches: DashboardBatchInput[],
  forecastByBatchId: Map<string, ForecastResult>,
) {
  const summaryByGenus = new Map<string, GenusSummary>();

  for (const batch of batches) {
    const forecast = forecastByBatchId.get(batch.id);

    if (!forecast) {
      continue;
    }

    const existing = summaryByGenus.get(batch.genusName) ?? {
      genusName: batch.genusName,
      categoryLabel: batch.categoryLabel ?? batch.genusName,
      batchCount: 0,
      startingQuantity: 0,
      projectedYield: 0,
      riskLevel: "clear" as const,
    };

    existing.batchCount += 1;
    existing.startingQuantity += batch.startingQuantity;
    existing.projectedYield += forecast.projectedYield;
    existing.riskLevel = strongestRisk(existing.riskLevel, riskLevelForForecast(forecast));
    summaryByGenus.set(batch.genusName, existing);
  }

  return [...summaryByGenus.values()].sort((a, b) =>
    a.categoryLabel.localeCompare(b.categoryLabel),
  );
}

function buildSeasonalAvailability(
  batches: DashboardBatchInput[],
  forecastByBatchId: Map<string, ForecastResult>,
) {
  const seasonByKey = new Map<string, SeasonalAvailability>();

  for (const batch of batches) {
    const forecast = forecastByBatchId.get(batch.id);

    if (!forecast || forecast.projectedYield <= 0) {
      continue;
    }

    const season = seasonForDate(forecast.estimatedReadyDate);
    const existing = seasonByKey.get(season.key) ?? {
      season: season.label,
      startsAt: season.startsAt,
      projectedYield: 0,
      batchCount: 0,
    };

    existing.projectedYield += forecast.projectedYield;
    existing.batchCount += 1;
    seasonByKey.set(season.key, existing);
  }

  return [...seasonByKey.values()].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

function seasonForDate(date: Date) {
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();

  if (month >= 2 && month <= 4) {
    return {
      key: `spring-${year}`,
      label: `Spring ${year}`,
      startsAt: new Date(Date.UTC(year, 2, 1)),
    };
  }

  if (month >= 5 && month <= 7) {
    return {
      key: `summer-${year}`,
      label: `Summer ${year}`,
      startsAt: new Date(Date.UTC(year, 5, 1)),
    };
  }

  if (month >= 8 && month <= 10) {
    return {
      key: `autumn-${year}`,
      label: `Autumn ${year}`,
      startsAt: new Date(Date.UTC(year, 8, 1)),
    };
  }

  return {
    key: `winter-${month === 11 ? year : year - 1}`,
    label: `Winter ${month === 11 ? year : year - 1}`,
    startsAt: new Date(Date.UTC(month === 11 ? year : year - 1, 11, 1)),
  };
}

function riskLevelForForecast(forecast: ForecastResult): GenusSummary["riskLevel"] {
  if (forecast.risks.some((risk) => risk.severity === "danger")) {
    return "threat";
  }

  if (forecast.risks.some((risk) => risk.severity === "warning")) {
    return "watch";
  }

  return "clear";
}

function strongestRisk(
  current: GenusSummary["riskLevel"],
  next: GenusSummary["riskLevel"],
) {
  const rank = {
    clear: 0,
    watch: 1,
    threat: 2,
  };

  return rank[next] > rank[current] ? next : current;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
