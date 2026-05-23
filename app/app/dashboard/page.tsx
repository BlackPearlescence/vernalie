import { AlertTriangle, BarChart3, FileSpreadsheet, Sprout } from "lucide-react";

import { requireUser } from "@/lib/supabase/server";

const cards = [
  {
    label: "Protected dashboard",
    value: "Auth ready",
    icon: BarChart3,
  },
  {
    label: "Nursery workspace",
    value: "Scoped",
    icon: Sprout,
  },
  {
    label: "CSV importer",
    value: "Next",
    icon: FileSpreadsheet,
  },
  {
    label: "Deficit alerts",
    value: "Queued",
    icon: AlertTriangle,
  },
];

export default async function DashboardPage() {
  await requireUser();

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
      <div className="mb-8">
        <p className="font-mono text-sm uppercase text-primary">Authenticated workspace</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
          Dashboard access is now behind Supabase Auth.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-secondary">
          The next step is to load nursery-scoped batch records through Prisma,
          pass them through the deterministic read model, and render the live
          inventory matrix here.
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
    </section>
  );
}
