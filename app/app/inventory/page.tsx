import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Filter,
  MapPin,
  Search,
  Sprout,
  Warehouse,
} from "lucide-react";

import type { Prisma } from "@/lib/generated/prisma/client";
import { BatchStatus, InfrastructureType } from "@/lib/generated/prisma/enums";
import { getPrisma } from "@/lib/server/prisma";
import { requireWorkspace } from "@/lib/server/workspace";

type InventorySearchParams = {
  q?: string | string[];
  status?: string | string[];
  infrastructure?: string | string[];
  location?: string | string[];
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<InventorySearchParams>;
}) {
  const { nursery } = await requireWorkspace();
  const filters = normalizeFilters(await searchParams);
  const prisma = getPrisma();
  const where = buildInventoryWhere(nursery.id, filters);
  const [batches, totals, locations] = await Promise.all([
    prisma.livingBatch.findMany({
      where,
      include: {
        category: {
          include: {
            genus: true,
          },
        },
        commitments: true,
      },
      orderBy: [
        {
          estimatedReadyDate: "asc",
        },
        {
          updatedAt: "desc",
        },
      ],
      take: 250,
    }),
    prisma.livingBatch.aggregate({
      where,
      _sum: {
        startingQuantity: true,
        currentQuantity: true,
        projectedYield: true,
      },
      _count: {
        id: true,
      },
    }),
    prisma.livingBatch.findMany({
      where: {
        nurseryId: nursery.id,
      },
      distinct: ["fieldLocation"],
      select: {
        fieldLocation: true,
      },
      orderBy: {
        fieldLocation: "asc",
      },
    }),
  ]);

  const deficitCount = batches.filter((batch) => {
    const committed = batch.commitments.reduce(
      (sum, commitment) => sum + commitment.committedQuantity,
      0,
    );
    return committed > batch.projectedYield;
  }).length;

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="font-mono text-sm uppercase text-primary">Living stock</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
            Inventory
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-secondary">
            Search imported batches, scan production status, and spot commitments
            that are outrunning projected yield.
          </p>
        </div>
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
          href="/app/import"
        >
          <Sprout className="h-4 w-4" />
          Import stock
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Batches" value={totals._count.id} icon={Sprout} />
        <SummaryCard
          label="Current units"
          value={totals._sum.currentQuantity ?? 0}
          icon={Warehouse}
        />
        <SummaryCard
          label="Projected yield"
          value={totals._sum.projectedYield ?? 0}
          icon={CalendarDays}
        />
        <SummaryCard
          label="Deficit risks"
          value={deficitCount}
          icon={AlertTriangle}
          tone={deficitCount ? "danger" : "default"}
        />
      </div>

      <form
        action="/app/inventory"
        className="mt-8 rounded-[8px] border border-border bg-surface p-4 sm:p-5"
      >
        <div className="mb-4 flex items-center gap-3">
          <Filter className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.9fr_0.9fr_auto]">
          <label className="relative">
            <span className="sr-only">Search inventory</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
            <input
              className="h-11 w-full rounded-[8px] border border-border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary"
              defaultValue={filters.q}
              name="q"
              placeholder="Search crop, cultivar, species, location"
            />
          </label>
          <SelectFilter
            defaultValue={filters.status}
            name="status"
            options={Object.values(BatchStatus)}
            placeholder="All statuses"
          />
          <SelectFilter
            defaultValue={filters.infrastructure}
            name="infrastructure"
            options={Object.values(InfrastructureType)}
            placeholder="All systems"
          />
          <SelectFilter
            defaultValue={filters.location}
            name="location"
            options={locations.map((location) => location.fieldLocation)}
            placeholder="All locations"
          />
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
            type="submit"
          >
            <Filter className="h-4 w-4" />
            Apply
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-hidden rounded-[8px] border border-border bg-surface">
        <div className="hidden overflow-auto lg:block">
          <table className="w-full min-w-[1020px] border-collapse text-left text-sm">
            <thead className="bg-surface-muted text-secondary">
              <tr>
                <th className="border-b border-border p-4 font-semibold">Crop</th>
                <th className="border-b border-border p-4 font-semibold">Location</th>
                <th className="border-b border-border p-4 font-semibold">Status</th>
                <th className="border-b border-border p-4 font-semibold">Current</th>
                <th className="border-b border-border p-4 font-semibold">Projected</th>
                <th className="border-b border-border p-4 font-semibold">Committed</th>
                <th className="border-b border-border p-4 font-semibold">Ready</th>
                <th className="border-b border-border p-4 font-semibold">Risk</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => {
                const committed = getCommittedQuantity(batch.commitments);
                const isDeficit = committed > batch.projectedYield;

                return (
                  <tr
                    className="border-b border-border transition hover:bg-surface-muted last:border-0"
                    key={batch.id}
                  >
                    <td className="p-4">
                      <Link
                        className="inline-flex items-center gap-2 font-semibold transition hover:text-primary"
                        href={`/app/inventory/${batch.id}`}
                      >
                        {batch.category.cultivarName}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <p className="mt-1 text-sm italic text-secondary">
                        {batch.category.genus.commonName ?? batch.category.genus.scientificName}
                      </p>
                    </td>
                    <td className="p-4">
                      <p>{batch.fieldLocation}</p>
                      <p className="mt-1 font-mono text-xs text-secondary">
                        {batch.infrastructureType}
                      </p>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={batch.status} />
                    </td>
                    <td className="p-4 font-mono">{batch.currentQuantity.toLocaleString()}</td>
                    <td className="p-4 font-mono">{batch.projectedYield.toLocaleString()}</td>
                    <td className="p-4 font-mono">{committed.toLocaleString()}</td>
                    <td className="p-4">{formatReadyDate(batch.estimatedReadyDate)}</td>
                    <td className="p-4">
                      <RiskBadge isDeficit={isDeficit} shock={batch.manualShockFactor} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-4 lg:hidden">
          {batches.map((batch) => {
            const committed = getCommittedQuantity(batch.commitments);
            const isDeficit = committed > batch.projectedYield;

            return (
              <Link
                className="block rounded-[8px] border border-border bg-background p-4 transition hover:bg-surface-muted"
                href={`/app/inventory/${batch.id}`}
                key={batch.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="inline-flex items-center gap-2 font-semibold">
                      {batch.category.cultivarName}
                      <ArrowRight className="h-4 w-4" />
                    </p>
                    <p className="mt-1 text-sm italic text-secondary">
                      {batch.category.genus.commonName ?? batch.category.genus.scientificName}
                    </p>
                  </div>
                  <StatusBadge status={batch.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <MobileMetric label="Current" value={batch.currentQuantity.toLocaleString()} />
                  <MobileMetric label="Projected" value={batch.projectedYield.toLocaleString()} />
                  <MobileMetric label="Committed" value={committed.toLocaleString()} />
                  <MobileMetric label="Ready" value={formatReadyDate(batch.estimatedReadyDate)} />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="inline-flex items-center gap-2 text-sm text-secondary">
                    <MapPin className="h-4 w-4" />
                    {batch.fieldLocation}
                  </p>
                  <RiskBadge isDeficit={isDeficit} shock={batch.manualShockFactor} />
                </div>
              </Link>
            );
          })}
        </div>

        {batches.length === 0 ? (
          <div className="p-8 text-center">
            <Sprout className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">No batches match these filters.</h2>
            <p className="mt-2 text-secondary">
              Clear the filters or import nursery stock to populate inventory.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function normalizeFilters(searchParams: InventorySearchParams) {
  return {
    q: readSingle(searchParams.q),
    status: readSingle(searchParams.status),
    infrastructure: readSingle(searchParams.infrastructure),
    location: readSingle(searchParams.location),
  };
}

function buildInventoryWhere(
  nurseryId: string,
  filters: ReturnType<typeof normalizeFilters>,
): Prisma.LivingBatchWhereInput {
  const where: Prisma.LivingBatchWhereInput = {
    nurseryId,
  };

  if (filters.status && isBatchStatus(filters.status)) {
    where.status = filters.status;
  }

  if (filters.infrastructure && isInfrastructureType(filters.infrastructure)) {
    where.infrastructureType = filters.infrastructure;
  }

  if (filters.location) {
    where.fieldLocation = filters.location;
  }

  if (filters.q) {
    where.OR = [
      {
        fieldLocation: {
          contains: filters.q,
          mode: "insensitive",
        },
      },
      {
        category: {
          cultivarName: {
            contains: filters.q,
            mode: "insensitive",
          },
        },
      },
      {
        category: {
          genus: {
            scientificName: {
              contains: filters.q,
              mode: "insensitive",
            },
          },
        },
      },
      {
        category: {
          genus: {
            commonName: {
              contains: filters.q,
              mode: "insensitive",
            },
          },
        },
      },
    ];
  }

  return where;
}

function readSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function isBatchStatus(value: string): value is BatchStatus {
  return Object.values(BatchStatus).includes(value as BatchStatus);
}

function isInfrastructureType(value: string): value is InfrastructureType {
  return Object.values(InfrastructureType).includes(value as InfrastructureType);
}

function SelectFilter({
  defaultValue,
  name,
  options,
  placeholder,
}: {
  defaultValue: string;
  name: string;
  options: string[];
  placeholder: string;
}) {
  return (
    <label>
      <span className="sr-only">{placeholder}</span>
      <select
        className="h-11 w-full rounded-[8px] border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
        defaultValue={defaultValue}
        name={name}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatEnumLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
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

function StatusBadge({ status }: { status: BatchStatus }) {
  const tone =
    status === BatchStatus.CULLED
      ? "bg-danger/10 text-danger"
      : status === BatchStatus.ON_HOLD
        ? "bg-warning/10 text-warning"
        : status === BatchStatus.READY_TO_SHIP
          ? "bg-success/10 text-success"
          : "bg-primary/10 text-primary";

  return (
    <span className={`inline-flex rounded-[8px] px-2 py-1 font-mono text-xs font-semibold ${tone}`}>
      {status}
    </span>
  );
}

function RiskBadge({ isDeficit, shock }: { isDeficit: boolean; shock: number }) {
  if (isDeficit) {
    return (
      <span className="inline-flex rounded-[8px] bg-danger/10 px-2 py-1 text-xs font-semibold text-danger">
        Deficit
      </span>
    );
  }

  if (shock > 0) {
    return (
      <span className="inline-flex rounded-[8px] bg-warning/10 px-2 py-1 text-xs font-semibold text-warning">
        Shock {(shock * 100).toFixed(0)}%
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-[8px] bg-success/10 px-2 py-1 text-xs font-semibold text-success">
      Clear
    </span>
  );
}

function MobileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-surface p-3">
      <p className="font-mono font-semibold">{value}</p>
      <p className="mt-1 text-xs text-secondary">{label}</p>
    </div>
  );
}

function getCommittedQuantity(
  commitments: Array<{
    committedQuantity: number;
  }>,
) {
  return commitments.reduce((sum, commitment) => sum + commitment.committedQuantity, 0);
}

function formatReadyDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
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
