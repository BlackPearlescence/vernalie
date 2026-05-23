import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseBrowserEnv, hasSupabaseBrowserEnv } from "./env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  if (!hasSupabaseBrowserEnv()) {
    return response;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseBrowserEnv();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}
