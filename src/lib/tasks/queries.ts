import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";

export type TaskRow = {
  id: string;
  title: string;
  due_at: string | null;
  is_done: boolean;
  assignee_id: string | null;
  visibility: string;
  owner_id: string | null;
  status: string;
  archived: boolean;
};

const AUTO_ARCHIVE_DONE_DAYS = 30;

/**
 * Sweep done tasks finished more than 30 days ago into the archive. Best-effort
 * (runs on tasks-page load); RLS scopes it to the caller's household and skips
 * the other member's personal tasks. Errors are ignored on purpose so the page
 * still renders before migration 0007 adds `archived_at`.
 */
export async function autoArchiveStaleDoneTasks(): Promise<void> {
  const user = await getUser();
  if (!user) return;
  const supabase = await createClient();
  const cutoff = new Date(
    Date.now() - AUTO_ARCHIVE_DONE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  await supabase
    .from("tasks")
    .update({ archived_at: new Date().toISOString() } as never)
    .eq("is_done", true)
    .is("archived_at", null)
    .is("deleted_at", null)
    .not("done_at", "is", null)
    .lt("done_at", cutoff);
}

/** Active (non-deleted) household tasks, open first then by due date. */
export async function getTasks(): Promise<TaskRow[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  // select("*") so visibility/owner_id work both before and after migration 0005.
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .is("deleted_at", null)
    .order("is_done", { ascending: true })
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  return (data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    due_at: t.due_at,
    is_done: t.is_done,
    assignee_id: t.assignee_id,
    visibility: (t as { visibility?: string }).visibility ?? "shared",
    owner_id: (t as { owner_id?: string | null }).owner_id ?? null,
    status: (t as { status?: string }).status ?? (t.is_done ? "done" : "todo"),
    archived: Boolean((t as { archived_at?: string | null }).archived_at),
  }));
}
