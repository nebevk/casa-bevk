import type { Metadata } from "next";
import { getEvents } from "@/lib/calendar/queries";
import { getHolidays } from "@/lib/calendar/holidays";
import { CalendarView } from "@/components/calendar/calendar-view";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const year = new Date().getFullYear();
  const [events, holidays] = await Promise.all([
    getEvents(),
    getHolidays([year - 1, year, year + 1]),
  ]);
  return <CalendarView events={events} holidays={holidays} />;
}
