"use client";

import { useState } from "react";
import {
  CalendarDays,
  ListTodo,
  Plus,
  Receipt,
  ShoppingCart,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import type { Member } from "@/lib/auth/dal";
import { NoteDialog } from "@/components/notes/note-dialog";
import { ExpenseDialog } from "@/components/expenses/expense-dialog";
import { EventDialog } from "@/components/calendar/event-dialog";
import { QuickTaskDialog } from "@/components/tasks/quick-task-dialog";
import { QuickShoppingDialog } from "@/components/shopping/quick-shopping-dialog";
import { cn } from "@/lib/utils";

type QuickAction = "expense" | "task" | "shopping" | "event" | "note";

/**
 * Floating bottom-right speed-dial. Tap to reveal quick capture for an expense,
 * to-do, shopping item, event, or note — one tap from anywhere.
 */
export function QuickAdd({
  members,
  categories,
  currentUserId,
}: {
  members: Member[];
  categories: string[];
  currentUserId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<QuickAction | null>(null);
  const close = () => setActive(null);
  const pick = (a: QuickAction) => {
    setActive(a);
    setOpen(false);
  };

  const actions: { key: QuickAction; label: string; icon: LucideIcon }[] = [
    { key: "expense", label: "Expense", icon: Receipt },
    { key: "task", label: "To-do", icon: ListTodo },
    { key: "shopping", label: "Shopping", icon: ShoppingCart },
    { key: "event", label: "Event", icon: CalendarDays },
    { key: "note", label: "Note", icon: StickyNote },
  ];

  return (
    <>
      <div className="fixed right-5 bottom-5 z-40 flex flex-col items-end gap-3 md:right-8 md:bottom-8">
        {open &&
          actions.map((a) => (
            <Action
              key={a.key}
              label={a.label}
              icon={a.icon}
              onClick={() => pick(a.key)}
            />
          ))}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Quick add"
          aria-expanded={open}
          className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-1 ring-foreground/10 transition hover:bg-primary/90 active:translate-y-px"
        >
          <Plus className={cn("size-6 transition-transform", open && "rotate-45")} />
        </button>
      </div>

      <ExpenseDialog
        members={members}
        categories={categories}
        currentUserId={currentUserId}
        open={active === "expense"}
        onOpenChange={(o) => !o && close()}
      />
      <QuickTaskDialog
        members={members}
        currentUserId={currentUserId}
        open={active === "task"}
        onOpenChange={(o) => !o && close()}
      />
      <QuickShoppingDialog
        open={active === "shopping"}
        onOpenChange={(o) => !o && close()}
      />
      <EventDialog open={active === "event"} onOpenChange={(o) => !o && close()} />
      <NoteDialog open={active === "note"} onOpenChange={(o) => !o && close()} />
    </>
  );
}

function Action({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-full bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-md ring-1 ring-border transition hover:bg-muted"
    >
      <Icon className="size-4 text-primary" />
      {label}
    </button>
  );
}
