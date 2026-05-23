"use client";

import { useActionState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { ArrowRight, Building2, Leaf, LockKeyhole, Mail } from "lucide-react";

import { login, signup } from "./actions";

const initialState = {
  message: "",
  tone: "error" as const,
};

export function LoginForm() {
  const [loginState, loginAction, isLoginPending] = useActionState(login, initialState);
  const [signupState, signupAction, isSignupPending] = useActionState(signup, initialState);
  const isPending = isLoginPending || isSignupPending;

  return (
    <div className="w-full max-w-md rounded-[8px] border border-border bg-surface p-6 shadow-[0_24px_80px_rgba(23,32,22,0.12)]">
      <div className="mb-7 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-primary text-white">
          <Leaf className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">Vernalie</h1>
          <p className="mt-1 text-sm text-secondary">Secure access for nursery teams.</p>
        </div>
      </div>

      <Tabs.Root defaultValue="signin">
        <Tabs.List className="grid rounded-[8px] border border-border bg-surface-muted p-1 sm:grid-cols-2">
          <Tabs.Trigger
            className="h-10 rounded-[6px] text-sm font-semibold text-secondary transition data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            value="signin"
          >
            Sign in
          </Tabs.Trigger>
          <Tabs.Trigger
            className="h-10 rounded-[6px] text-sm font-semibold text-secondary transition data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            value="register"
          >
            Register
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content className="pt-6" value="signin">
          <form action={loginAction} className="space-y-4">
            <AuthInput
              autoComplete="email"
              icon={Mail}
              label="Email"
              name="email"
              type="email"
            />
            <AuthInput
              autoComplete="current-password"
              icon={LockKeyhole}
              label="Password"
              minLength={8}
              name="password"
              type="password"
            />

            <AuthMessage message={loginState.message} tone={loginState.tone} />

            <button
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isPending}
              type="submit"
            >
              Sign in
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </Tabs.Content>

        <Tabs.Content className="pt-6" value="register">
          <form action={signupAction} className="space-y-4">
            <AuthInput
              autoComplete="organization"
              icon={Building2}
              label="Nursery business name"
              name="businessName"
              type="text"
            />
            <div className="grid gap-3 sm:grid-cols-[0.72fr_1fr]">
              <label className="block">
                <span className="text-sm font-medium text-foreground">USDA zone</span>
                <select
                  className="mt-2 h-12 w-full rounded-[8px] border border-border bg-background px-3 text-base outline-none transition focus:border-primary"
                  name="usdaZone"
                  required
                  defaultValue="6"
                >
                  {Array.from({ length: 13 }, (_, index) => index + 1).map((zone) => (
                    <option key={zone} value={zone}>
                      Zone {zone}
                    </option>
                  ))}
                </select>
              </label>
              <AuthInput
                autoComplete="postal-code"
                label="ZIP code"
                name="zipCode"
                pattern="[0-9]{5}"
                type="text"
              />
            </div>
            <AuthInput
              autoComplete="email"
              icon={Mail}
              label="Email"
              name="email"
              type="email"
            />
            <AuthInput
              autoComplete="new-password"
              icon={LockKeyhole}
              label="Password"
              minLength={8}
              name="password"
              type="password"
            />
            <AuthInput
              autoComplete="new-password"
              icon={LockKeyhole}
              label="Confirm password"
              minLength={8}
              name="confirmPassword"
              type="password"
            />

            <AuthMessage message={signupState.message} tone={signupState.tone} />

            <button
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isPending}
              type="submit"
            >
              Create nursery workspace
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

function AuthInput({
  icon: Icon,
  label,
  ...inputProps
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="relative mt-2 block">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
        )}
        <input
          className={`h-12 w-full rounded-[8px] border border-border bg-background px-3 text-base outline-none transition focus:border-primary ${Icon ? "pl-10" : ""}`}
          required
          {...inputProps}
        />
      </span>
    </label>
  );
}

function AuthMessage({
  message,
  tone,
}: {
  message?: string;
  tone?: "error" | "success";
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={`rounded-[8px] border p-3 text-sm ${
        tone === "success"
          ? "border-success/30 bg-success/10 text-foreground"
          : "border-danger/30 bg-danger/10 text-foreground"
      }`}
    >
      {message}
    </p>
  );
}
