import { AlertTriangle, BarChart3, CalendarDays, FileSpreadsheet, Sprout } from "lucide-react";

import { getDashboardForNursery } from "@/lib/server/dashboard-data";
import { requireWorkspace } from "@/lib/server/workspace";

export default async function DashboardPage() {
  const { nursery } = await requireWorkspace();
  const dashboard = await getDashboardForNursery(nursery.id);
  const cards = [
    {
      label: "Active batches",
      value: dashboard.totals.activeBatchCount.toLocaleString(),
      icon: Sprout,
    },
    {
      label: "Starting units",
      value: dashboard.totals.startingQuantity.toLocaleString(),
      icon: FileSpreadsheet,
    },
    {
      label: "Projected yield",
      value: dashboard.totals.projectedYield.toLocaleString(),
      icon: BarChart3,
    },
    {
      label: "Deficit alerts",
      value: dashboard.totals.deficitAlertCount.toLocaleString(),
      icon: AlertTriangle,
    },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
      <div className="mb-8">
        <p className="font-mono text-sm uppercase text-primary">Authenticated workspace</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
          {nursery.businessName}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-secondary">
          This dashboard is now scoped to USDA zone {nursery.usdaZone} and ZIP{" "}
          {nursery.zipCode}. Next we will load this nursery&apos;s batches,
          commitments, and seasonal forecast matrix.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article className="rounded-[8px] border border-border bg-surface p-5" key={card.label}>
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-5 font-mono text-2xl font-semibold">{card.value}</p>
              <p className="mt-2 text-sm text-secondary">{card.label}</p>
            </article>
          );
        })}
      </div>

      {dashboard.totals.activeBatchCount === 0 ? (
        <div className="mt-8 rounded-[8px] border border-border bg-surface p-8">
          <p className="font-mono text-sm uppercase text-primary">No inventory yet</p>
          <h2 className="mt-3 text-2xl font-semibold">Create or import your first batches.</h2>
          <p className="mt-3 max-w-2xl leading-7 text-secondary">
            This nursery workspace is ready. The next flow will let you import a CSV
            layout or add a new production batch from the greenhouse bench.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[8px] border border-border bg-surface p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-sm uppercase text-primary">Inventory groups</p>
                <h2 className="mt-2 text-xl font-semibold">Botanical summary</h2>
              </div>
              <Sprout className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              {dashboard.genusSummaries.map((summary) => (
                <div
                  className="grid gap-3 rounded-[8px] border border-border bg-background p-4 sm:grid-cols-[1fr_auto]"
                  key={summary.genusName}
                >
                  <div>
                    <p className="font-semibold">{summary.categoryLabel}</p>
                    <p className="mt-1 text-sm italic text-secondary">{summary.genusName}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-mono text-lg font-semibold">
                      {summary.projectedYield.toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm capitalize text-secondary">
                      {summary.batchCount} batches · {summary.riskLevel}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[8px] border border-border bg-surface p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-sm uppercase text-primary">Availability</p>
                <h2 className="mt-2 text-xl font-semibold">Shipping seasons</h2>
              </div>
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              {dashboard.seasonalAvailability.map((season) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-[8px] bg-background p-4"
                  key={season.season}
                >
                  <div>
                    <p className="font-semibold">{season.season}</p>
                    <p className="mt-1 text-sm text-secondary">{season.batchCount} batches</p>
                  </div>
                  <p className="font-mono text-lg font-semibold">
                    {season.projectedYield.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
