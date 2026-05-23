import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  FileSpreadsheet,
  Layers3,
  Sprout,
} from "lucide-react";

import { getPrisma } from "@/lib/server/prisma";
import { requireWorkspace } from "@/lib/server/workspace";

type ImportResultSnapshot = {
  importedCount: number;
  commitmentCount: number;
  duplicateCount: number;
  importedBatchIds: string[];
  skippedDuplicates: Array<{
    cultivarName: string;
    fieldLocation: string;
    datePlanted: string;
    reason: string;
  }>;
  createdCategories: string[];
  matchedCategories: string[];
};

type HeaderSnapshot = {
  headers?: string[];
  mapping?: Record<string, string>;
  result?: Partial<ImportResultSnapshot>;
};

export default async function ImportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { nursery } = await requireWorkspace();
  const prisma = getPrisma();
  const importJob = await prisma.importJob.findFirst({
    where: {
      id,
      nurseryId: nursery.id,
    },
  });

  if (!importJob) {
    notFound();
  }

  const snapshot = parseHeaderSnapshot(importJob.headerSnapshot);
  const result = normalizeResult(snapshot.result);
  const importedBatches = result.importedBatchIds.length
    ? await prisma.livingBatch.findMany({
        where: {
          id: {
            in: result.importedBatchIds,
          },
          nurseryId: nursery.id,
        },
        include: {
          category: {
            include: {
              genus: true,
            },
          },
          commitments: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    : [];

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
      <div className="mb-8">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-secondary transition hover:text-foreground"
          href="/app/import"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to imports
        </Link>
        <div className="mt-6 flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="font-mono text-sm uppercase text-primary">Import job</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              {importJob.originalFileName}
            </h1>
            <p className="mt-3 text-secondary">
              {importJob.createdAt.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
          <span className="rounded-[8px] bg-surface-muted px-3 py-2 font-mono text-sm font-semibold text-secondary">
            {importJob.status}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard icon={FileSpreadsheet} label="Rows reviewed" value={importJob.rowCount} />
        <SummaryCard icon={Sprout} label="Batches created" value={result.importedCount} />
        <SummaryCard icon={Layers3} label="Commitments" value={result.commitmentCount} />
        <SummaryCard
          icon={AlertTriangle}
          label="Duplicates skipped"
          tone={result.duplicateCount ? "warning" : "default"}
          value={result.duplicateCount}
        />
      </div>

      {importJob.errorMessage ? (
        <div className="mt-6 rounded-[8px] border border-danger bg-danger/10 p-4 text-danger">
          <p className="font-semibold">Import failed</p>
          <p className="mt-2 text-sm">{importJob.errorMessage}</p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[8px] border border-border bg-surface p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-sm uppercase text-primary">Created inventory</p>
              <h2 className="mt-2 text-xl font-semibold">Batches</h2>
            </div>
            <Sprout className="h-5 w-5 text-primary" />
          </div>

          {importedBatches.length === 0 ? (
            <div className="rounded-[8px] bg-background p-4 text-sm text-secondary">
              No new batches were created by this import.
            </div>
          ) : (
            <div className="space-y-3">
              {importedBatches.map((batch) => (
                <div
                  className="rounded-[8px] border border-border bg-background p-4"
                  key={batch.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{batch.category.cultivarName}</p>
                      <p className="mt-1 text-sm italic text-secondary">
                        {batch.category.genus.commonName ?? batch.category.genus.scientificName}
                      </p>
                    </div>
                    <p className="font-mono text-lg font-semibold">
                      {batch.projectedYield.toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-secondary sm:grid-cols-3">
                    <span>{batch.fieldLocation}</span>
                    <span>{batch.infrastructureType}</span>
                    <span>
                      {batch.commitments.length.toLocaleString()} commitments
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-[8px] border border-border bg-surface p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-sm uppercase text-primary">Duplicate guard</p>
                <h2 className="mt-2 text-xl font-semibold">Skipped rows</h2>
              </div>
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            {result.skippedDuplicates.length === 0 ? (
              <div className="rounded-[8px] bg-background p-4 text-sm text-secondary">
                No duplicate rows were skipped.
              </div>
            ) : (
              <div className="space-y-3">
                {result.skippedDuplicates.map((duplicate, index) => (
                  <div
                    className="rounded-[8px] border border-warning bg-warning/10 p-4 text-sm text-warning"
                    key={`${duplicate.cultivarName}-${index}`}
                  >
                    <p className="font-semibold">{duplicate.cultivarName}</p>
                    <p className="mt-1">
                      {duplicate.fieldLocation} ·{" "}
                      {new Date(duplicate.datePlanted).toLocaleDateString("en-US")}
                    </p>
                    <p className="mt-2">{duplicate.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[8px] border border-border bg-surface p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-sm uppercase text-primary">Catalog match</p>
                <h2 className="mt-2 text-xl font-semibold">Cultivar handling</h2>
              </div>
              <Check className="h-5 w-5 text-success" />
            </div>
            <CategoryList label="Matched existing" values={result.matchedCategories} />
            <div className="mt-4">
              <CategoryList label="Created new" values={result.createdCategories} />
            </div>
          </section>
        </div>
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
  tone?: "default" | "warning";
}) {
  return (
    <article className="rounded-[8px] border border-border bg-surface p-5">
      <Icon className={`h-5 w-5 ${tone === "warning" ? "text-warning" : "text-primary"}`} />
      <p className="mt-5 font-mono text-2xl font-semibold">{value.toLocaleString()}</p>
      <p className="mt-2 text-sm text-secondary">{label}</p>
    </article>
  );
}

function CategoryList({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-secondary">{label}</p>
      {values.length === 0 ? (
        <p className="mt-2 rounded-[8px] bg-background p-3 text-sm text-secondary">None</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              className="rounded-[8px] bg-background px-3 py-2 text-sm font-semibold"
              key={value}
            >
              {value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function parseHeaderSnapshot(value: unknown): HeaderSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as HeaderSnapshot;
}

function normalizeResult(result: HeaderSnapshot["result"]): ImportResultSnapshot {
  return {
    importedCount: Number(result?.importedCount ?? 0),
    commitmentCount: Number(result?.commitmentCount ?? 0),
    duplicateCount: Number(result?.duplicateCount ?? 0),
    importedBatchIds: Array.isArray(result?.importedBatchIds) ? result.importedBatchIds : [],
    skippedDuplicates: Array.isArray(result?.skippedDuplicates)
      ? result.skippedDuplicates
      : [],
    createdCategories: Array.isArray(result?.createdCategories)
      ? result.createdCategories
      : [],
    matchedCategories: Array.isArray(result?.matchedCategories)
      ? result.matchedCategories
      : [],
  };
}
