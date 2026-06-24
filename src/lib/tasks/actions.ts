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

export async function addTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const assigneeRaw = String(formData.get("assignee_id") ?? "");
  const assignee_id =
    assigneeRaw && assigneeRaw !== "none" ? assigneeRaw : null;
  const dueRaw = String(formData.get("due") ?? "").trim();
  const due_at = dueRaw ? new Date(dueRaw).toISOString() : null;

  const { user, household, supabase } = await authedContext();
  await supabase.from("tasks").insert({
    household_id: household.id,
    title,
    assignee_id,
    due_at,
    created_by: user.id,
  });
  revalidatePath("/tasks");
}

export async function toggleTask(id: string, isDone: boolean) {
  const { supabase } = await authedContext();
  await supabase
    .from("tasks")
    .update({
      is_done: isDone,
      done_at: isDone ? new Date().toISOString() : null,
    })
    .eq("id", id);
  revalidatePath("/tasks");
}

export async function setTaskAssignee(id: string, assigneeId: string | null) {
  const { supabase } = await authedContext();
  await supabase.from("tasks").update({ assignee_id: assigneeId }).eq("id", id);
  revalidatePath("/tasks");
}

export async function deleteTask(id: string) {
  const { supabase } = await authedContext();
  await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/tasks");
}
