import type { Metadata } from "next";
import { ListTodo } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "To-Do" };

export default function TasksPage() {
  return (
    <PagePlaceholder
      title="To-Do"
      description="Shared task lists — assign tasks, set due dates, and check things off together."
      icon={ListTodo}
    />
  );
}
