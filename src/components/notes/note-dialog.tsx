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
import { useT } from "@/lib/i18n/provider";
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
  const t = useT();
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
        toast.error(t("notes.saveError"));
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isEdit ? t("notes.editNote") : t("notes.newNote")}
          </DialogTitle>
          <DialogDescription>{t("notes.dialogDesc")}</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          <Input
            name="title"
            placeholder={t("notes.titlePlaceholder")}
            defaultValue={note?.title ?? ""}
            autoComplete="off"
          />
          <textarea
            name="body"
            placeholder={t("notes.bodyPlaceholder")}
            defaultValue={note?.body ?? ""}
            rows={6}
            className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
          />
          <div className="flex gap-2">
            {(["shared", "personal"] as const).map((value) => (
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
                {t(`notes.${value}`)}
              </button>
            ))}
          </div>

          <Input
            name="category"
            list="note-categories"
            defaultValue={note?.category ?? ""}
            placeholder={t("notes.categoryPlaceholder")}
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
              {isEdit ? t("notes.save") : t("notes.addNote")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
