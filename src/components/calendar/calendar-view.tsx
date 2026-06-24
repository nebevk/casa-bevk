"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { CalendarEvent, Occurrence } from "@/lib/calendar/recurrence";
import { expandEvents } from "@/lib/calendar/recurrence";
import { EventDialog } from "./event-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function CalendarView({
  events,
  holidays,
}: {
  events: CalendarEvent[];
  holidays: Record<string, string>;
}) {
  const today = new Date();
  const [cursor, setCursor] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  });
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [addDate, setAddDate] = useState<string | null>(null);

  const { days, byDay, label } = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startOffset = (first.getDay() + 6) % 7; // Monday-start grid
    const gridStart = new Date(cursor.y, cursor.m, 1 - startOffset);
    const grid: Date[] = [];
    for (let i = 0; i < 42; i++) {
      grid.push(
        new Date(
          gridStart.getFullYear(),
          gridStart.getMonth(),
          gridStart.getDate() + i,
        ),
      );
    }
    const rangeStart = new Date(
      grid[0].getFullYear(),
      grid[0].getMonth(),
      grid[0].getDate(),
    );
    const last = grid[41];
    const rangeEnd = new Date(
      last.getFullYear(),
      last.getMonth(),
      last.getDate(),
      23,
      59,
      59,
    );
    const map = new Map<string, Occurrence[]>();
    for (const o of expandEvents(events, rangeStart, rangeEnd)) {
      const k = keyOf(o.start);
      const arr = map.get(k) ?? [];
      arr.push(o);
      map.set(k, arr);
    }
    return {
      days: grid,
      byDay: map,
      label: first.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    };
  }, [cursor, events]);

  const shift = (delta: number) =>
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  const todayKey = keyOf(today);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Calendar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your shared family calendar.
          </p>
        </div>
        <EventDialog
          trigger={
            <Button>
              <Plus />
              New event
            </Button>
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
          <span className="ml-2 font-heading text-lg font-medium">{label}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setCursor({ y: today.getFullYear(), m: today.getMonth() })
          }
        >
          Today
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-medium text-muted-foreground">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const inMonth = d.getMonth() === cursor.m;
            const k = keyOf(d);
            const dayOcc = byDay.get(k) ?? [];
            const isToday = k === todayKey;
            return (
              <div
                key={i}
                onClick={() => setAddDate(k)}
                className={cn(
                  "min-h-24 cursor-pointer border-r border-b border-border p-1.5 transition-colors hover:bg-muted/40 [&:nth-child(7n)]:border-r-0",
                  !inMonth && "bg-muted/20",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-6 items-center justify-center rounded-full text-xs",
                    !inMonth && "text-muted-foreground",
                    isToday && "bg-primary font-semibold text-primary-foreground",
                  )}
                >
                  {d.getDate()}
                </span>
                {holidays[k] && (
                  <div
                    className="mt-0.5 truncate rounded bg-accent/70 px-1 py-0.5 text-[10px] font-medium text-accent-foreground"
                    title={holidays[k]}
                  >
                    {holidays[k]}
                  </div>
                )}
                <div className="mt-1 space-y-1">
                  {dayOcc.slice(0, 3).map((o, j) => (
                    <div
                      key={`${o.event.id}-${j}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(o.event);
                      }}
                      className="truncate rounded bg-primary/10 px-1 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/20"
                      title={o.event.title}
                    >
                      {!o.event.all_day && (
                        <span className="tabular-nums">
                          {pad(o.start.getHours())}:{pad(o.start.getMinutes())}{" "}
                        </span>
                      )}
                      {o.event.title}
                    </div>
                  ))}
                  {dayOcc.length > 3 && (
                    <div className="px-1 text-[10px] text-muted-foreground">
                      +{dayOcc.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {addDate && (
        <EventDialog
          defaultDate={addDate}
          open
          onOpenChange={(o) => {
            if (!o) setAddDate(null);
          }}
        />
      )}
      {editing && (
        <EventDialog
          event={editing}
          open
          onOpenChange={(o) => {
            if (!o) setEditing(null);
          }}
        />
      )}
    </div>
  );
}
