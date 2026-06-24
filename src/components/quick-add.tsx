"use client";

import { useState } from "react";
import { Plus, Receipt, StickyNote, type LucideIcon } from "lucide-react";
import type { Member } from "@/lib/auth/dal";
import { NoteDialog } from "@/components/notes/note-dialog";
import { ExpenseDialog } from "@/components/expenses/expense-dialog";
import { cn } from "@/lib/utils";

/**
 * Floating bottom-right speed-dial. Tap to reveal quick "Expense" and "Note"
 * capture — so jotting a purchase or a thought is one tap from anywhere.
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
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  return (
    <>
      <div className="fixed right-5 bottom-5 z-40 flex flex-col items-end gap-3 md:right-8 md:bottom-8">
        {open && (
          <>
            <Action
              label="Expense"
              icon={Receipt}
              onClick={() => {
                setExpenseOpen(true);
                setOpen(false);
              }}
            />
            <Action
              label="Note"
              icon={StickyNote}
              onClick={() => {
                setNoteOpen(true);
                setOpen(false);
              }}
            />
          </>
        )}
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
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
      />
      <NoteDialog open={noteOpen} onOpenChange={setNoteOpen} />
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
