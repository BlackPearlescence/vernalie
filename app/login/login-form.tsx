"use client";

import { useActionState } from "react";
import { ArrowRight, Leaf } from "lucide-react";

import { login, signup } from "./actions";

const initialState = {
  message: "",
};

export function LoginForm() {
  const [loginState, loginAction, isLoginPending] = useActionState(login, initialState);
  const [signupState, signupAction, isSignupPending] = useActionState(signup, initialState);

  return (
    <div className="w-full max-w-md rounded-[8px] border border-border bg-surface p-6 shadow-[0_24px_80px_rgba(23,32,22,0.12)]">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-primary text-white">
          <Leaf className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">Welcome to Vernalie</h1>
          <p className="mt-1 text-sm text-secondary">Sign in or create your nursery workspace.</p>
        </div>
      </div>

      <form className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-foreground">Email</span>
          <input
            className="mt-2 h-12 w-full rounded-[8px] border border-border bg-background px-3 text-base outline-none transition focus:border-primary"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">Password</span>
          <input
            className="mt-2 h-12 w-full rounded-[8px] border border-border bg-background px-3 text-base outline-none transition focus:border-primary"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
          />
        </label>

        {(loginState.message || signupState.message) && (
          <p className="rounded-[8px] border border-border bg-surface-muted p-3 text-sm text-secondary">
            {loginState.message || signupState.message}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
            formAction={loginAction}
            disabled={isLoginPending || isSignupPending}
          >
            Sign in
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            className="inline-flex h-12 items-center justify-center rounded-[8px] border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-70"
            formAction={signupAction}
            disabled={isLoginPending || isSignupPending}
          >
            Create account
          </button>
        </div>
      </form>
    </div>
  );
}
