import Link from "next/link";
import { FileSpreadsheet, UploadCloud } from "lucide-react";

import { getPrisma } from "@/lib/server/prisma";
import { requireWorkspace } from "@/lib/server/workspace";

import { ImportWorkspace } from "./import-workspace";

export default async function ImportPage() {
  const { nursery } = await requireWorkspace();
  const prisma = getPrisma();
  const recentImports = await prisma.importJob.findMany({
    where: {
      nurseryId: nursery.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="font-mono text-sm uppercase text-primary">Inventory intake</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
            Spreadsheet import
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-secondary">
            Convert grower spreadsheets into forecast-ready nursery batches with
            saved column mappings and deterministic yield projections.
          </p>
        </div>

        <aside className="rounded-[8px] border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-sm uppercase text-primary">Recent jobs</p>
              <h2 className="mt-2 text-xl font-semibold">Import trail</h2>
            </div>
            <FileSpreadsheet className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-5 space-y-3">
            {recentImports.length === 0 ? (
              <div className="rounded-[8px] bg-background p-4 text-sm text-secondary">
                No imports recorded yet.
              </div>
            ) : (
              recentImports.map((job) => (
                <Link
                  className="block rounded-[8px] border border-border bg-background p-4 transition hover:bg-surface-muted"
                  href={`/app/import/${job.id}`}
                  key={job.id}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <p className="min-w-0 truncate font-semibold">
                      {job.originalFileName}
                    </p>
                    <span className="shrink-0 rounded-[8px] bg-surface-muted px-2 py-1 font-mono text-xs text-secondary">
                      {job.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-secondary">
                    {job.rowCount.toLocaleString()} rows ·{" "}
                    {job.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </Link>
              ))
            )}
          </div>
        </aside>
      </div>

      <div className="rounded-[8px] border border-border bg-surface p-4 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-primary text-white">
            <UploadCloud className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">Load nursery stock</h2>
            <p className="text-sm text-secondary">CSV and XLSX files are supported.</p>
          </div>
        </div>
        <ImportWorkspace />
      </div>
    </section>
  );
}
