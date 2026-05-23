import "server-only";

import { ensureOwnerNurseryForUser } from "./nursery-membership";
import { requireUser } from "@/lib/supabase/server";

export type WorkspaceContext = Awaited<ReturnType<typeof requireWorkspace>>;

export async function requireWorkspace() {
  const user = await requireUser();
  const membership = await ensureOwnerNurseryForUser(user);

  return {
    user,
    membership,
    nursery: membership.nursery,
  };
}
