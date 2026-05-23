import { NextResponse, type NextRequest } from "next/server";

import { ensureOwnerNurseryForUser } from "@/lib/server/nursery-membership";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/app/dashboard";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await ensureOwnerNurseryForUser(user);
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
