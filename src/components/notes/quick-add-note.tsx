"use client";

import { StickyNote } from "lucide-react";
import { NoteDialog } from "./note-dialog";

/** Floating bottom-right button to quickly capture a note from anywhere. */
export function QuickAddNote() {
  return (
    <NoteDialog
      trigger={
        <button
          type="button"
          aria-label="Quick add note"
          className="fixed right-5 bottom-5 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-1 ring-foreground/10 transition hover:bg-primary/90 active:translate-y-px md:right-8 md:bottom-8"
        >
          <StickyNote className="size-6" />
        </button>
      }
    />
  );
}
