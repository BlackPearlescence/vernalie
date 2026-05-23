import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  MapPin,
  Sprout,
  ThermometerSun,
  Warehouse,
} from "lucide-react";

import { forecastBatch } from "@/lib/domain/forecasting";
import type { BatchStatus } from "@/lib/generated/prisma/enums";
import { getPrisma } from "@/lib/server/prisma";
import { requireWorkspace } from "@/lib/server/workspace";

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { nursery } = await requireWorkspace();
  const prisma = getPrisma();
  const batch = await prisma.livingBatch.findFirst({
    where: {
      id,
      nurseryId: nursery.id,
    },
    include: {
      category: {
        include: {
          genus: true,
        },
      },
      commitments: {
        orderBy: {
          targetShipDate: "asc",
        },
      },
    },
  });

  if (!batch) {
    notFound();
  }

  const forecast = forecastBatch({
    id: batch.id,
    nurseryUsdaZone: nursery.usdaZone,
    lifecycleType: batch.category.lifecycleType,
    startingQuantity: batch.startingQuantity,
    currentQuantity: batch.currentQuantity,
    baseLossRate: batch.category.genus.baseLossRate,
    decayModifier: batch.category.decayModifier,
    minSurvivalZone: batch.category.minSurvivalZone,
    weeksToHarvest: batch.category.weeksToHarvest,
    infrastructureType: batch.infrastructureType,
    manualShockFactor: batch.manualShockFactor,
    datePlanted: batch.datePlanted,
  });
  const committedQuantity = batch.commitments.reduce(
    (sum, commitment) => sum + commitment.committedQuantity,
    0,
  );
  const deficit = Math.max(0, committedQuantity - forecast.projectedYield);
  const readyMonth = forecast.timeline.find((month) => month.isReadyMonth);
  const maxTimelineQuantity = Math.max(
    1,
    ...forecast.timeline.map((month) => month.projectedQuantity),
  );

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
      <div className="mb-8">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-secondary transition hover:text-foreground"
          href="/app/inventory"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to inventory
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="font-mono text-sm uppercase text-primary">Batch detail</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              {batch.category.cultivarName}
            </h1>
            <p className="mt-3 text-lg italic text-secondary">
              {batch.category.genus.scientificName}
            </p>
          </div>
          <StatusBadge status={batch.status} />
        </div>
      </div>

      {deficit > 0 ? (
        <div className="mb-6 rounded-[8px] border border-danger bg-danger/10 p-5 text-danger">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">
                Deficit warning: -{deficit.toLocaleString()} units
              </p>
              <p className="mt-2 text-sm">
                Commitments exceed the current deterministic projected yield for this
                batch.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={Warehouse}
          label="Current units"
          value={batch.currentQuantity}
        />
        <SummaryCard
          icon={Sprout}
          label="Projected yield"
          value={forecast.projectedYield}
        />
        <SummaryCard
          icon={ClipboardList}
          label="Committed"
          tone={deficit ? "danger" : "default"}
          value={committedQuantity}
        />
        <SummaryCard
          icon={CalendarDays}
          label="Weeks to harvest"
          value={batch.category.weeksToHarvest}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[8px] border border-border bg-surface p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-sm uppercase text-primary">Production</p>
              <h2 className="mt-2 text-xl font-semibold">Batch facts</h2>
            </div>
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <dl className="grid gap-3">
            <FactRow label="Location" value={batch.fieldLocation} />
            <FactRow label="Infrastructure" value={formatEnumLabel(batch.infrastructureType)} />
            <FactRow label="Lifecycle" value={formatEnumLabel(batch.category.lifecycleType)} />
            <FactRow label="Date planted" value={formatDate(batch.datePlanted)} />
            <FactRow label="Ready date" value={formatDate(forecast.estimatedReadyDate)} />
            <FactRow label="USDA zone" value={`Zone ${nursery.usdaZone}`} />
            <FactRow
              label="Manual shock"
              value={`${(batch.manualShockFactor * 100).toFixed(0)}%`}
            />
            <FactRow
              label="Loss rate"
              value={`${((batch.category.genus.baseLossRate + batch.category.decayModifier) * 100).toFixed(1)}%`}
            />
          </dl>
        </section>

        <section className="rounded-[8px] border border-border bg-surface p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-sm uppercase text-primary">Forecast matrix</p>
              <h2 className="mt-2 text-xl font-semibold">36-month projection</h2>
            </div>
            <ThermometerSun className="h-5 w-5 text-primary" />
          </div>
          <div className="flex h-56 items-end gap-1 overflow-hidden rounded-[8px] border border-border bg-background p-4">
            {forecast.timeline.map((month) => (
              <div
                className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                key={month.monthIndex}
                title={`${formatMonth(month.date)}: ${month.projectedQuantity.toLocaleString()}`}
              >
                <div
                  className={`w-full rounded-t-[4px] ${
                    month.isReadyMonth ? "bg-accent" : "bg-primary"
                  }`}
                  style={{
                    height: `${Math.max(4, (month.projectedQuantity / maxTimelineQuantity) * 170)}px`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MiniMetric label="Planted" value={formatDate(batch.datePlanted)} />
            <MiniMetric
              label="Ready month"
              value={readyMonth ? formatMonth(readyMonth.date) : formatMonth(forecast.estimatedReadyDate)}
            />
            <MiniMetric
              label="Horizon end"
              value={formatMonth(forecast.timeline.at(-1)?.date ?? forecast.estimatedReadyDate)}
            />
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[8px] border border-border bg-surface p-5">
          <div className="mb-5">
            <p className="font-mono text-sm uppercase text-primary">Risk signals</p>
            <h2 className="mt-2 text-xl font-semibold">Forecast warnings</h2>
          </div>
          {forecast.risks.length === 0 ? (
            <div className="rounded-[8px] bg-background p-4 text-sm text-secondary">
              No deterministic risk flags for this batch.
            </div>
          ) : (
            <div className="space-y-3">
              {forecast.risks.map((risk) => (
                <div
                  className={`rounded-[8px] border p-4 ${
                    risk.severity === "danger"
                      ? "border-danger bg-danger/10 text-danger"
                      : risk.severity === "warning"
                        ? "border-warning bg-warning/10 text-warning"
                        : "border-border bg-background text-secondary"
                  }`}
                  key={risk.code}
                >
                  <p className="font-semibold">{formatEnumLabel(risk.code)}</p>
                  <p className="mt-1 text-sm">{risk.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[8px] border border-border bg-surface p-5">
          <div className="mb-5">
            <p className="font-mono text-sm uppercase text-primary">Contracts</p>
            <h2 className="mt-2 text-xl font-semibold">Commitments</h2>
          </div>
          {batch.commitments.length === 0 ? (
            <div className="rounded-[8px] bg-background p-4 text-sm text-secondary">
              No contract commitments are attached to this batch.
            </div>
          ) : (
            <div className="space-y-3">
              {batch.commitments.map((commitment) => (
                <div
                  className="grid gap-3 rounded-[8px] border border-border bg-background p-4 sm:grid-cols-[1fr_auto]"
                  key={commitment.id}
                >
                  <div>
                    <p className="font-semibold">{commitment.externalRef}</p>
                    <p className="mt-1 text-sm text-secondary">
                      Target {formatDate(commitment.targetShipDate)}
                    </p>
                  </div>
                  <p className="font-mono text-lg font-semibold">
                    {commitment.committedQuantity.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: "default" | "danger";
}) {
  return (
    <article className="rounded-[8px] border border-border bg-surface p-5">
      <Icon className={`h-5 w-5 ${tone === "danger" ? "text-danger" : "text-primary"}`} />
      <p className="mt-5 font-mono text-2xl font-semibold">{value.toLocaleString()}</p>
      <p className="mt-2 text-sm text-secondary">{label}</p>
    </article>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 rounded-[8px] bg-background p-3">
      <dt className="text-sm text-secondary">{label}</dt>
      <dd className="text-sm font-semibold">{value}</dd>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-background p-3">
      <p className="font-semibold">{value}</p>
      <p className="mt-1 text-xs text-secondary">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: BatchStatus }) {
  const tone =
    status === "CULLED"
      ? "bg-danger/10 text-danger"
      : status === "ON_HOLD"
        ? "bg-warning/10 text-warning"
        : status === "READY_TO_SHIP"
          ? "bg-success/10 text-success"
          : "bg-primary/10 text-primary";

  return (
    <span className={`inline-flex rounded-[8px] px-3 py-2 font-mono text-sm font-semibold ${tone}`}>
      {status}
    </span>
  );
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMonth(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
