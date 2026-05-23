"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseBrowserEnv } from "./env";

export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseBrowserEnv();

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
