import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  CloudOff,
  FileSpreadsheet,
  Leaf,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

const categoryRows = [
  { name: "Pome Fruits", batches: "48 batches", risk: "Low", units: "18,420" },
  { name: "Stone Fruits", batches: "26 batches", risk: "Watch", units: "7,880" },
  { name: "Greenhouse Plugs", batches: "91 batches", risk: "Clear", units: "41,300" },
];

const seasons = [
  { label: "Spring 2027", value: "24.6k", tone: "bg-primary" },
  { label: "Autumn 2027", value: "18.1k", tone: "bg-accent" },
  { label: "Spring 2028", value: "31.4k", tone: "bg-success" },
];

const capabilities = [
  {
    icon: TriangleAlert,
    title: "Deficit warnings",
    text: "Surface contract risk before shortages become emergency calls.",
  },
  {
    icon: BarChart3,
    title: "Deterministic forecasts",
    text: "Audit-ready yield math based on cultivar traits, zones, and local shock factors.",
  },
  {
    icon: CloudOff,
    title: "Field-ready offline mode",
    text: "Keep batch work moving from benches, hoop houses, and back lots.",
  },
  {
    icon: FileSpreadsheet,
    title: "Spreadsheet import",
    text: "Map messy nursery columns into clean inventory records in minutes.",
  },
];

const workflow = [
  "Import nursery spreadsheets without rewriting every column by hand.",
  "Track living batches by cultivar, location, infrastructure, and status.",
  "Project availability across shipping seasons with explainable botanical rules.",
  "Spot shortages early enough to adjust production, holds, and customer promises.",
];

function DashboardPlaceholder() {
  return (
    <div className="relative overflow-hidden rounded-[8px] border border-border bg-surface shadow-[0_24px_80px_rgba(23,32,22,0.14)]">
      <div className="flex items-center justify-between border-b border-border bg-surface-muted px-4 py-3">
        <div>
          <p className="font-mono text-xs uppercase text-secondary">Vernalie Matrix</p>
          <p className="text-sm font-semibold text-foreground">Living inventory forecast</p>
        </div>
        <div className="rounded-full bg-danger px-3 py-1 font-mono text-xs font-semibold text-white">
          -128 units
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
        <div className="border-b border-border p-4 md:border-b-0 md:border-r">
          <div className="mb-4 rounded-[8px] border border-danger/30 bg-danger/10 p-3">
            <p className="font-mono text-xs font-semibold uppercase text-danger">
              Deficit warning
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              Contract #INV-882 compromised
            </p>
          </div>

          <div className="space-y-3">
            {categoryRows.map((row) => (
              <div
                className="grid grid-cols-[1fr_auto] gap-3 rounded-[8px] border border-border bg-surface px-3 py-3"
                key={row.name}
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{row.name}</p>
                  <p className="mt-1 text-xs text-secondary">{row.batches}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold text-foreground">{row.units}</p>
                  <p className="mt-1 text-xs text-secondary">{row.risk}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Shipping seasons</p>
            <CalendarDays className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-4">
            {seasons.map((season, index) => (
              <div key={season.label}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-secondary">{season.label}</p>
                  <p className="font-mono text-xs font-semibold text-foreground">
                    {season.value}
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className={`h-full rounded-full ${season.tone}`}
                    style={{ width: `${62 + index * 12}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[8px] border border-border bg-surface-muted p-3">
            <p className="font-mono text-xs uppercase text-secondary">Shock override</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-border">
                <div className="h-2 w-2/5 rounded-full bg-warning" />
              </div>
              <p className="font-mono text-xs font-semibold text-foreground">0.14</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <a className="flex items-center gap-3" href="#top" aria-label="Vernalie home">
          <span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-primary text-white">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold">Vernalie</span>
        </a>
        <div className="hidden items-center gap-8 text-sm font-medium text-secondary md:flex">
          <a className="transition hover:text-foreground" href="#workflow">
            Workflow
          </a>
          <a className="transition hover:text-foreground" href="#forecasting">
            Forecasting
          </a>
          <a className="transition hover:text-foreground" href="#offline">
            Offline
          </a>
        </div>
        <a
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
          href="/login"
        >
          Open app
          <ArrowRight className="h-4 w-4" />
        </a>
      </nav>

      <section id="top" className="mx-auto w-full max-w-7xl px-5 pb-16 pt-10 sm:px-8 lg:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-[8px] border border-border bg-surface px-3 py-2 text-sm font-medium text-secondary">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Deterministic inventory planning for growers
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] text-foreground sm:text-6xl lg:text-7xl">
              Predictive inventory planning for commercial nurseries.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-secondary sm:text-xl">
              Replace fragile spreadsheets with an offline-ready dashboard for living
              batches, yield forecasts, deficit alerts, and seasonal availability.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
                href="/login"
              >
                Open app
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] border border-border bg-surface px-5 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
                href="#workflow"
              >
                See workflow
              </a>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-border pt-6">
              <div>
                <p className="font-mono text-2xl font-semibold">36mo</p>
                <p className="mt-1 text-sm text-secondary">forecast horizon</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-semibold">0 AI</p>
                <p className="mt-1 text-sm text-secondary">black boxes</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-semibold">2min</p>
                <p className="mt-1 text-sm text-secondary">CSV mapping</p>
              </div>
            </div>
          </div>

          <div id="demo" aria-label="Placeholder dashboard preview">
            <DashboardPlaceholder />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-5 py-6 sm:px-8 md:grid-cols-4">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <article className="rounded-[8px] p-4" key={item.title}>
                <Icon className="h-5 w-5 text-primary" />
                <h2 className="mt-4 text-base font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-secondary">{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="workflow"
        className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]"
      >
        <div>
          <p className="font-mono text-sm uppercase text-primary">From spreadsheet to matrix</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
            Built around the real nursery production loop.
          </h2>
          <p className="mt-5 text-lg leading-8 text-secondary">
            Vernalie keeps static cultivar knowledge separate from local batch conditions,
            so each forecast can explain what changed and why.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {workflow.map((step, index) => (
            <div className="rounded-[8px] border border-border bg-surface p-5" key={step}>
              <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-[8px] bg-primary text-sm font-semibold text-white">
                {index + 1}
              </div>
              <p className="text-base font-medium leading-7">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="forecasting" className="bg-foreground text-background">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2">
          <div>
            <p className="font-mono text-sm uppercase text-accent">No black-box forecasting</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
              Deterministic math your operation can defend.
            </h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-background/75">
            <p>
              Multi-year perennials compound monthly loss across a 36-month horizon.
              Rapid annuals use flat germination deficits at the harvest window.
            </p>
            <p>
              Zone risk, infrastructure type, cultivar fragility, and manager shock
              overrides are explicit parameters, not hidden model behavior.
            </p>
          </div>
        </div>
      </section>

      <section id="offline" className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-8 rounded-[8px] border border-border bg-surface p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="font-mono text-sm uppercase text-primary">Tablet-first operations</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">
              Fast enough for the bench. Clear enough for the office.
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-secondary">
              Field actions stay thumb-accessible, CSV imports stay self-service, and
              cached data keeps production work moving when greenhouse Wi-Fi does not.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
            {["Offline queue", "CSV mapper", "Batch drawer", "Season timeline"].map((item) => (
              <div className="flex items-center gap-3 rounded-[8px] bg-surface-muted p-3" key={item}>
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold">Vernalie</p>
            <p className="mt-2 text-sm text-secondary">
              Predictive Inventory Matrix for nurseries and greenhouses.
            </p>
          </div>
          <a
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover md:w-auto"
            href="#top"
          >
            Back to top
            <ArrowRight className="h-4 w-4 rotate-[-45deg]" />
          </a>
        </div>
      </footer>
    </main>
  );
}
