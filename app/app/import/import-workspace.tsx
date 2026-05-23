"use client";

import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  FileUp,
  Loader2,
  RotateCcw,
  Save,
  UploadCloud,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

type ImportField =
  | "species"
  | "cultivar"
  | "quantity"
  | "location"
  | "infrastructureType"
  | "datePlanted"
  | "status"
  | "manualShockFactor"
  | "contractRef"
  | "committedQuantity"
  | "targetShipDate";

type ImportColumnMapping = Partial<Record<ImportField, string>>;

type ImportDraftPreview = {
  speciesName: string;
  cultivarName: string;
  quantity: number;
  fieldLocation: string;
  infrastructureType: string;
  datePlanted: string;
  status: string;
  manualShockFactor: number;
  contract?: {
    externalRef: string;
    committedQuantity: number;
    targetShipDate: string;
  };
};

type PreviewResponse = {
  fileName: string;
  sheetName: string;
  headers: string[];
  mapping: ImportColumnMapping;
  inferredMapping: ImportColumnMapping;
  rowCount: number;
  drafts: ImportDraftPreview[];
  errors: Array<{
    rowNumber: number;
    message: string;
  }>;
};

type CommitResult = {
  importJobId: string;
  importedCount: number;
  commitmentCount: number;
};

const importFields: Array<{
  key: ImportField;
  label: string;
  required?: boolean;
}> = [
  { key: "species", label: "Species", required: true },
  { key: "cultivar", label: "Cultivar", required: true },
  { key: "quantity", label: "Quantity", required: true },
  { key: "location", label: "Location", required: true },
  { key: "infrastructureType", label: "Infrastructure", required: true },
  { key: "datePlanted", label: "Date planted", required: true },
  { key: "status", label: "Status" },
  { key: "manualShockFactor", label: "Shock factor" },
  { key: "contractRef", label: "Contract ref" },
  { key: "committedQuantity", label: "Committed qty" },
  { key: "targetShipDate", label: "Ship date" },
];

export function ImportWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [mapping, setMapping] = useState<ImportColumnMapping>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);

  const requiredMapped = useMemo(
    () => importFields.filter((field) => field.required).every((field) => mapping[field.key]),
    [mapping],
  );
  const validDraftCount = preview?.drafts.length ?? 0;
  const errorCount = preview?.errors.length ?? 0;

  async function loadPreview(nextFile: File, nextMapping?: ImportColumnMapping) {
    setIsParsing(true);
    setMessage(null);
    setCommitResult(null);

    const formData = new FormData();
    formData.append("file", nextFile);

    if (nextMapping) {
      formData.append("mapping", JSON.stringify(nextMapping));
    }

    try {
      const response = await fetch("/api/import/preview", {
        method: "POST",
        body: formData,
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.message ?? "Preview failed.");
      }

      setPreview(body);
      setMapping(body.mapping);
    } catch (error) {
      setPreview(null);
      setMapping({});
      setMessage(error instanceof Error ? error.message : "Preview failed.");
    } finally {
      setIsParsing(false);
    }
  }

  function chooseFile(nextFile: File | undefined) {
    if (!nextFile) {
      return;
    }

    setFile(nextFile);
    void loadPreview(nextFile);
  }

  async function refreshPreview() {
    if (!file) {
      return;
    }

    await loadPreview(file, mapping);
  }

  async function commitImport() {
    if (!preview || !requiredMapped || validDraftCount === 0) {
      setMessage("Map required columns before importing.");
      return;
    }

    setIsCommitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/import/commit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: preview.fileName,
          headers: preview.headers,
          mapping,
          drafts: preview.drafts,
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.message ?? "Import failed.");
      }

      setCommitResult(body);
      setMessage("Import saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setIsCommitting(false);
    }
  }

  function resetImport() {
    setFile(null);
    setPreview(null);
    setMapping({});
    setMessage(null);
    setCommitResult(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <div className="space-y-4">
        <button
          className={`flex min-h-[220px] w-full flex-col items-center justify-center rounded-[8px] border border-dashed p-6 text-center transition ${
            isDragging
              ? "border-primary bg-surface-muted"
              : "border-border bg-background hover:bg-surface-muted"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            chooseFile(event.dataTransfer.files[0]);
          }}
          type="button"
        >
          <input
            accept=".csv,.xlsx"
            className="sr-only"
            onChange={(event) => chooseFile(event.target.files?.[0])}
            ref={inputRef}
            type="file"
          />
          <FileUp className="h-9 w-9 text-primary" />
          <span className="mt-5 text-lg font-semibold">
            {file ? file.name : "Drop file or tap to browse"}
          </span>
          <span className="mt-2 text-sm text-secondary">
            {preview
              ? `${preview.rowCount.toLocaleString()} source rows detected`
              : "CSV or XLSX nursery inventory"}
          </span>
        </button>

        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Valid rows" value={validDraftCount.toLocaleString()} />
          <MetricCard label="Errors" value={errorCount.toLocaleString()} tone={errorCount ? "danger" : "default"} />
          <MetricCard label="Columns" value={(preview?.headers.length ?? 0).toLocaleString()} />
        </div>

        {message ? (
          <div
            className={`rounded-[8px] border p-4 text-sm font-semibold ${
              commitResult
                ? "border-success bg-success/10 text-success"
                : "border-danger bg-danger/10 text-danger"
            }`}
          >
            {message}
            {commitResult ? (
              <p className="mt-2 font-normal">
                {commitResult.importedCount.toLocaleString()} batches ·{" "}
                {commitResult.commitmentCount.toLocaleString()} commitments
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex gap-3">
          <button
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[8px] border border-border bg-surface px-4 text-sm font-semibold transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!file || isParsing}
            onClick={refreshPreview}
            type="button"
          >
            {isParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Preview
          </button>
          <button
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[8px] bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!preview || !requiredMapped || validDraftCount === 0 || isCommitting}
            onClick={commitImport}
            type="button"
          >
            {isCommitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Import
          </button>
        </div>

        {file || preview ? (
          <button
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] text-sm font-semibold text-secondary transition hover:bg-surface-muted"
            onClick={resetImport}
            type="button"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        ) : null}
      </div>

      <div className="space-y-6">
        <section className="rounded-[8px] border border-border bg-background p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm uppercase text-primary">Column map</p>
              <h3 className="mt-1 text-lg font-semibold">Detected fields</h3>
            </div>
            <StatusPill ok={requiredMapped} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {importFields.map((field) => (
              <label
                className="grid gap-2 rounded-[8px] border border-border bg-surface p-3"
                key={field.key}
              >
                <span className="flex items-center justify-between gap-3 text-sm font-semibold">
                  {field.label}
                  {field.required ? (
                    <span className="font-mono text-xs uppercase text-primary">Required</span>
                  ) : null}
                </span>
                <span className="relative">
                  <select
                    className="h-11 w-full appearance-none rounded-[8px] border border-border bg-background px-3 pr-9 text-sm outline-none transition focus:border-primary"
                    disabled={!preview}
                    onChange={(event) =>
                      setMapping((current) => ({
                        ...current,
                        [field.key]: event.target.value || undefined,
                      }))
                    }
                    value={mapping[field.key] ?? ""}
                  >
                    <option value="">Unmapped</option>
                    {preview?.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-[8px] border border-border bg-background p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm uppercase text-primary">Preview</p>
              <h3 className="mt-1 text-lg font-semibold">Clean batch rows</h3>
            </div>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-border bg-surface px-3 text-sm font-semibold transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!file || isParsing}
              onClick={refreshPreview}
              type="button"
            >
              <ArrowRight className="h-4 w-4" />
              Apply map
            </button>
          </div>

          {preview ? (
            <div className="overflow-hidden rounded-[8px] border border-border">
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="sticky top-0 bg-surface text-secondary">
                    <tr>
                      <th className="border-b border-border p-3 font-semibold">Crop</th>
                      <th className="border-b border-border p-3 font-semibold">Quantity</th>
                      <th className="border-b border-border p-3 font-semibold">Location</th>
                      <th className="border-b border-border p-3 font-semibold">System</th>
                      <th className="border-b border-border p-3 font-semibold">Planted</th>
                      <th className="border-b border-border p-3 font-semibold">Contract</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.drafts.slice(0, 80).map((draft, index) => (
                      <tr className="border-b border-border last:border-0" key={`${draft.speciesName}-${draft.cultivarName}-${index}`}>
                        <td className="p-3">
                          <p className="font-semibold">{draft.cultivarName}</p>
                          <p className="text-secondary">{draft.speciesName}</p>
                        </td>
                        <td className="p-3 font-mono">{draft.quantity.toLocaleString()}</td>
                        <td className="p-3">{draft.fieldLocation}</td>
                        <td className="p-3 font-mono text-xs">{draft.infrastructureType}</td>
                        <td className="p-3">{formatDate(draft.datePlanted)}</td>
                        <td className="p-3">
                          {draft.contract ? (
                            <span className="font-semibold text-primary">
                              {draft.contract.externalRef}
                            </span>
                          ) : (
                            <span className="text-secondary">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center rounded-[8px] border border-dashed border-border bg-surface p-6 text-center">
              <div>
                <UploadCloud className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-4 font-semibold">Awaiting spreadsheet</p>
                <p className="mt-2 text-sm text-secondary">Preview rows will appear here.</p>
              </div>
            </div>
          )}

          {preview?.errors.length ? (
            <div className="mt-4 space-y-2">
              {preview.errors.slice(0, 8).map((error) => (
                <div
                  className="flex gap-3 rounded-[8px] border border-danger bg-danger/10 p-3 text-sm text-danger"
                  key={`${error.rowNumber}-${error.message}`}
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Row {error.rowNumber}: {error.message}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-[8px] border border-border bg-background p-3">
      <p className={`font-mono text-xl font-semibold ${tone === "danger" ? "text-danger" : ""}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-secondary">{label}</p>
    </div>
  );
}

function StatusPill({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex h-9 items-center gap-2 rounded-[8px] px-3 text-sm font-semibold ${
        ok ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
      }`}
    >
      {ok ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      {ok ? "Ready" : "Needs map"}
    </span>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
