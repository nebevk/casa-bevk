import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";

export type TaskRow = {
  id: string;
  title: string;
  due_at: string | null;
  is_done: boolean;
  assignee_id: string | null;
};

/** Active (non-deleted) household tasks, open first then by due date. */
export async function getTasks(): Promise<TaskRow[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("id, title, due_at, is_done, assignee_id")
    .is("deleted_at", null)
    .order("is_done", { ascending: true })
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  return data ?? [];
}
