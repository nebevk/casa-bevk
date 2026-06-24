import type { Metadata } from "next";
import { getHouseholdMembers, getUser } from "@/lib/auth/dal";
import { getTasks } from "@/lib/tasks/queries";
import { TasksView } from "@/components/tasks/tasks-view";

export const metadata: Metadata = { title: "To-Do" };

export default async function TasksPage() {
  const [tasks, members, user] = await Promise.all([
    getTasks(),
    getHouseholdMembers(),
    getUser(),
  ]);

  return (
    <TasksView tasks={tasks} members={members} currentUserId={user?.id ?? null} />
  );
}
