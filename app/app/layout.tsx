import Link from "next/link";
import { FileSpreadsheet, Leaf, LogOut } from "lucide-react";

import { logout } from "@/app/login/actions";
import { requireWorkspace } from "@/lib/server/workspace";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { nursery, user } = await requireWorkspace();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link className="flex items-center gap-3" href="/app/dashboard">
            <span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-primary text-white">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold">Vernalie</span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-[8px] px-3 text-sm font-semibold text-secondary transition hover:bg-surface-muted hover:text-foreground"
              href="/app/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] px-3 text-sm font-semibold text-secondary transition hover:bg-surface-muted hover:text-foreground"
              href="/app/import"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Import
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <p className="hidden max-w-[220px] truncate text-sm font-semibold text-foreground md:block">
              {nursery.businessName}
            </p>
            <p className="hidden max-w-[260px] truncate text-sm text-secondary sm:block">
              {user.email}
            </p>
            <form action={logout}>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
                type="submit"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}
