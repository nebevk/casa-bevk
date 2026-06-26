"use client";

import { useMemo, useState, useTransition } from "react";
import { Pin, Plus, Search, Trash2 } from "lucide-react";
import type { NoteRow } from "@/lib/notes/queries";
import { deleteNote, togglePin } from "@/lib/notes/actions";
import { NoteDialog } from "./note-dialog";
import { BooksArt, CozyEmpty } from "@/components/cozy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Mutate = (fn: () => Promise<void> | void) => void;

export function NotesView({ notes }: { notes: NoteRow[] }) {
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<"all" | "shared" | "personal">(
    "all",
  );
  const [category, setCategory] = useState<string | null>(null);
  const [editing, setEditing] = useState<NoteRow | null>(null);
  const [, startTransition] = useTransition();
  const mutate: Mutate = (fn) => startTransition(fn);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          notes.map((n) => n.category).filter((c): c is string => Boolean(c)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [notes],
  );

  const filtered = notes.filter((n) => {
    if (visibility !== "all" && n.visibility !== visibility) return false;
    if (category && n.category !== category) return false;
    if (query.trim()) {
      const hay = `${n.title ?? ""} ${n.body ?? ""} ${n.category ?? ""}`.toLowerCase();
      if (!hay.includes(query.trim().toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Notes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Personal &amp; shared notes for the household.
          </p>
        </div>
        <NoteDialog
          categories={categories}
          trigger={
            <Button>
              <Plus />
              New note
            </Button>
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "shared", "personal"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setVisibility(f)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm capitalize transition-colors",
                visibility === f
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <CategoryChip active={category === null} onClick={() => setCategory(null)}>
            All categories
          </CategoryChip>
          {categories.map((c) => (
            <CategoryChip
              key={c}
              active={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </CategoryChip>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <CozyEmpty art={<BooksArt />}>
          {notes.length === 0
            ? "No notes yet. Add one with “New note” or the button in the corner."
            : "No notes match your filters."}
        </CozyEmpty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={() => setEditing(note)}
              onPickCategory={setCategory}
              mutate={mutate}
            />
          ))}
        </div>
      )}

      {editing && (
        <NoteDialog
          note={editing}
          categories={categories}
          open
          onOpenChange={(o) => {
            if (!o) setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function NoteCard({
  note,
  onEdit,
  onPickCategory,
  mutate,
}: {
  note: NoteRow;
  onEdit: () => void;
  onPickCategory: (c: string) => void;
  mutate: Mutate;
}) {
  return (
    <div
      onClick={onEdit}
      className="group relative flex cursor-pointer flex-col rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-1 font-medium">{note.title || "Untitled"}</h3>
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => mutate(() => togglePin(note.id, !note.is_pinned))}
            aria-label={note.is_pinned ? "Unpin" : "Pin"}
            className={cn(
              "transition-colors hover:text-primary",
              note.is_pinned ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Pin className={cn("size-4", note.is_pinned && "fill-current")} />
          </button>
          <button
            type="button"
            onClick={() => mutate(() => deleteNote(note.id))}
            aria-label="Delete note"
            className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      {note.body && (
        <p className="mt-2 line-clamp-5 text-sm whitespace-pre-wrap text-muted-foreground">
          {note.body}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            note.visibility === "personal"
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {note.visibility === "personal" ? "Personal" : "Shared"}
        </span>
        {note.category && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPickCategory(note.category!);
            }}
            className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20"
          >
            {note.category}
          </button>
        )}
      </div>
    </div>
  );
}
