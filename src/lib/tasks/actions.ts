"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdId, getUser } from "@/lib/auth/dal";

async function authedContext() {
  const [user, householdId] = await Promise.all([getUser(), getHouseholdId()]);
  if (!user || !householdId) throw new Error("Not authorized");
  const supabase = await createClient();
  return { user, household: { id: householdId }, supabase };
}

export async function addTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const assigneeRaw = String(formData.get("assignee_id") ?? "");
  const assignee_id =
    assigneeRaw && assigneeRaw !== "none" ? assigneeRaw : null;
  const dueRaw = String(formData.get("due") ?? "").trim();
  const due_at = dueRaw ? new Date(dueRaw).toISOString() : null;

  const { user, household, supabase } = await authedContext();
  const { error } = await supabase.from("tasks").insert({
    household_id: household.id,
    title,
    assignee_id,
    due_at,
    created_by: user.id,
  });
  if (error) throw error;
  revalidatePath("/tasks");
}

export async function toggleTask(id: string, isDone: boolean) {
  const { supabase } = await authedContext();
  const { error } = await supabase
    .from("tasks")
    .update({
      is_done: isDone,
      done_at: isDone ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/tasks");
}

export async function setTaskAssignee(id: string, assigneeId: string | null) {
  const { supabase } = await authedContext();
  const { error } = await supabase
    .from("tasks")
    .update({ assignee_id: assigneeId })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/tasks");
}

export async function deleteTask(id: string) {
  const { supabase } = await authedContext();
  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/tasks");
}
