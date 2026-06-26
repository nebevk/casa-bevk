"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addNote, updateNote } from "@/lib/notes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type EditableNote = {
  id: string;
  title: string | null;
  body: string | null;
  visibility: string;
  category: string | null;
};

export function NoteDialog({
  trigger,
  note,
  categories = [],
  open,
  onOpenChange,
}: {
  trigger?: ReactNode;
  note?: EditableNote;
  categories?: string[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = Boolean(note?.id);
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [visibility, setVisibility] = useState(note?.visibility ?? "shared");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("visibility", visibility);
    setOpen(false);
    if (!isEdit) setVisibility("shared");
    startTransition(async () => {
      try {
        if (isEdit && note) await updateNote(note.id, formData);
        else await addNote(formData);
      } catch {
        toast.error("Couldn't save note — please try again.");
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isEdit ? "Edit note" : "New note"}
          </DialogTitle>
          <DialogDescription>
            Shared notes are visible to both of you; personal notes only to you.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          <Input
            name="title"
            placeholder="Title"
            defaultValue={note?.title ?? ""}
            autoComplete="off"
          />
          <textarea
            name="body"
            placeholder="Write a note…"
            defaultValue={note?.body ?? ""}
            rows={6}
            className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <div className="flex gap-2">
            {(
              [
                ["shared", "Shared"],
                ["personal", "Personal"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setVisibility(value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  visibility === value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <Input
            name="category"
            list="note-categories"
            defaultValue={note?.category ?? ""}
            placeholder="Category (optional) — e.g. Recipes, Ideas, Travel"
            autoComplete="off"
          />
          {categories.length > 0 && (
            <datalist id="note-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isEdit ? "Save" : "Add note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
