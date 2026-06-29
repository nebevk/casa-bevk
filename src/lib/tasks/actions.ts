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
  const visibility =
    formData.get("visibility") === "personal" ? "personal" : "shared";

  const { user, household, supabase } = await authedContext();
  const base = {
    household_id: household.id,
    title,
    assignee_id,
    due_at,
    created_by: user.id,
  };
  const { error } = await supabase
    .from("tasks")
    .insert({ ...base, visibility, owner_id: user.id } as never);
  if (error) {
    // visibility/owner_id arrive in migration 0005; fall back to a shared task.
    const { error: fallbackError } = await supabase.from("tasks").insert(base);
    if (fallbackError) throw fallbackError;
  }
  revalidatePath("/tasks");
}

export async function setTaskVisibility(
  id: string,
  visibility: "personal" | "shared",
) {
  const { supabase } = await authedContext();
  const { error } = await supabase
    .from("tasks")
    .update({ visibility } as never)
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/tasks");
}

export async function setTaskStatus(
  id: string,
  status: "todo" | "in_progress" | "done",
) {
  const isDone = status === "done";
  const doneAt = isDone ? new Date().toISOString() : null;
  const { supabase } = await authedContext();
  const { error } = await supabase
    .from("tasks")
    .update({ status, is_done: isDone, done_at: doneAt } as never)
    .eq("id", id);
  if (error) {
    // status column arrives in migration 0006; keep is_done in sync meanwhile.
    const { error: fallbackError } = await supabase
      .from("tasks")
      .update({ is_done: isDone, done_at: doneAt })
      .eq("id", id);
    if (fallbackError) throw fallbackError;
  }
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function archiveTask(id: string) {
  const { supabase } = await authedContext();
  const { error } = await supabase
    .from("tasks")
    .update({ archived_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/tasks");
}

export async function unarchiveTask(id: string) {
  const { supabase } = await authedContext();
  const { error } = await supabase
    .from("tasks")
    .update({ archived_at: null } as never)
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/tasks");
}

/** Archive every done task in the household (clears the Done column). */
export async function archiveDoneTasks() {
  const { household, supabase } = await authedContext();
  const { error } = await supabase
    .from("tasks")
    .update({ archived_at: new Date().toISOString() } as never)
    .eq("household_id", household.id)
    .eq("is_done", true)
    .is("archived_at", null)
    .is("deleted_at", null);
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
