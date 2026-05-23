"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ensureOwnerNurseryForUser } from "@/lib/server/nursery-membership";
import { createClient } from "@/lib/supabase/server";

type AuthState = {
  message?: string;
};

export async function login(_state: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      message: error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect("/app/dashboard");
}

export async function signup(_state: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return {
      message: error.message,
    };
  }

  if (data.user && data.session) {
    await ensureOwnerNurseryForUser(data.user);
    revalidatePath("/", "layout");
    redirect("/app/dashboard");
  }

  return {
    message: "Check your email to finish creating your Vernalie account.",
  };
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
