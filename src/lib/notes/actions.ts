"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHousehold, getUser } from "@/lib/auth/dal";

async function authedContext() {
  const [user, household] = await Promise.all([getUser(), getHousehold()]);
  if (!user || !household) throw new Error("Not authorized");
  const supabase = await createClient();
  return { user, household, supabase };
}

function readNote(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim() || null;
  const body = String(formData.get("body") ?? "").trim() || null;
  const visibility =
    formData.get("visibility") === "personal" ? "personal" : "shared";
  return { title, body, visibility } as const;
}

export async function addNote(formData: FormData) {
  const { title, body, visibility } = readNote(formData);
  if (!title && !body) return;
  const { user, household, supabase } = await authedContext();
  await supabase.from("notes").insert({
    household_id: household.id,
    owner_id: user.id,
    visibility,
    title,
    body,
    created_by: user.id,
  });
  revalidatePath("/notes");
}

export async function updateNote(id: string, formData: FormData) {
  const { title, body, visibility } = readNote(formData);
  const { supabase } = await authedContext();
  await supabase.from("notes").update({ title, body, visibility }).eq("id", id);
  revalidatePath("/notes");
}

export async function togglePin(id: string, pinned: boolean) {
  const { supabase } = await authedContext();
  await supabase.from("notes").update({ is_pinned: pinned }).eq("id", id);
  revalidatePath("/notes");
}

export async function deleteNote(id: string) {
  const { supabase } = await authedContext();
  await supabase
    .from("notes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/notes");
}
