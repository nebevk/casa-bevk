import type { Metadata } from "next";
import { getEvents } from "@/lib/calendar/queries";
import { CalendarView } from "@/components/calendar/calendar-view";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const events = await getEvents();
  return <CalendarView events={events} />;
}
