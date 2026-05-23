"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ensureOwnerNurseryForUser } from "@/lib/server/nursery-membership";
import { createClient } from "@/lib/supabase/server";

type AuthState = {
  message?: string;
  tone?: "error" | "success";
};

export async function login(_state: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      message: "Enter your email and password.",
      tone: "error",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      message: error.message,
      tone: "error",
    };
  }

  revalidatePath("/", "layout");
  redirect("/app/dashboard");
}

export async function signup(_state: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const businessName = String(formData.get("businessName") ?? "").trim();
  const zipCode = String(formData.get("zipCode") ?? "").trim();
  const usdaZone = Number(formData.get("usdaZone"));

  if (!email || !password || !businessName || !zipCode || !Number.isInteger(usdaZone)) {
    return {
      message: "Complete every registration field.",
      tone: "error",
    };
  }

  if (password !== confirmPassword) {
    return {
      message: "Passwords do not match.",
      tone: "error",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
      data: {
        businessName,
        usdaZone,
        zipCode,
      },
    },
  });

  if (error) {
    return {
      message: error.message,
      tone: "error",
    };
  }

  if (data.user && data.session) {
    await ensureOwnerNurseryForUser(data.user, {
      businessName,
      usdaZone,
      zipCode,
    });
    revalidatePath("/", "layout");
    redirect("/app/dashboard");
  }

  return {
    message: "Check your email to finish creating your Vernalie account.",
    tone: "success",
  };
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
