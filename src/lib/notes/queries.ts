import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";

export type NoteRow = {
  id: string;
  title: string | null;
  body: string | null;
  visibility: string;
  is_pinned: boolean;
  owner_id: string | null;
  updated_at: string;
};

/** Active notes the user can see (shared + their own personal), pinned first. */
export async function getNotes(): Promise<NoteRow[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("notes")
    .select("id, title, body, visibility, is_pinned, owner_id, updated_at")
    .is("deleted_at", null)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });
  return data ?? [];
}
