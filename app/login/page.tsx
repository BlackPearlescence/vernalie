import { redirect } from "next/navigation";

import { hasSupabaseBrowserEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (!hasSupabaseBrowserEnv()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground">
        <section className="w-full max-w-xl rounded-[8px] border border-border bg-surface p-6">
          <p className="font-mono text-sm uppercase text-primary">Supabase setup needed</p>
          <h1 className="mt-4 text-3xl font-semibold">Auth keys are not configured yet.</h1>
          <p className="mt-4 leading-7 text-secondary">
            Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to
            your .env file, then restart the dev server.
          </p>
        </section>
      </main>
    );
  }

  const user = await getCurrentUser();

  if (user) {
    redirect("/app/dashboard");
  }

  return (
    <main className="grid min-h-screen bg-background px-5 py-10 text-foreground lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
      <section className="mx-auto flex w-full max-w-xl flex-col justify-center">
        <p className="font-mono text-sm uppercase text-primary">Secure nursery workspace</p>
        <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
          Turn living inventory into an accountable forecast.
        </h2>
        <p className="mt-5 text-lg leading-8 text-secondary">
          Vernalie protects each nursery workspace with Supabase Auth, then scopes
          batches, imports, forecasts, and deficit warnings to that business.
        </p>
      </section>
      <section className="mx-auto flex w-full max-w-xl items-center justify-center py-12">
        <LoginForm />
      </section>
    </main>
  );
}
