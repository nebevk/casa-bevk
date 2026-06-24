import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <PagePlaceholder
      title="Calendar"
      description="A shared family calendar with events, recurrence, and reminders."
      icon={CalendarDays}
    />
  );
}
