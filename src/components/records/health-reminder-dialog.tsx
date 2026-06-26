"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Member } from "@/lib/auth/dal";
import type { HealthReminderRow } from "@/lib/medical/queries";
import {
  addHealthReminder,
  updateHealthReminder,
} from "@/lib/medical/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const KINDS = [
  ["checkup", "Checkup"],
  ["vaccination", "Vaccination"],
  ["screening", "Screening"],
  ["other", "Other"],
] as const;

export function HealthReminderDialog({
  trigger,
  reminder,
  members,
  currentUserId,
  open,
  onOpenChange,
}: {
  trigger?: ReactNode;
  reminder?: HealthReminderRow;
  members: Member[];
  currentUserId: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = Boolean(reminder?.id);
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [kind, setKind] = useState<string>(reminder?.kind ?? "checkup");
  const defaultMember = reminder
    ? (reminder.member_id ?? "both")
    : (currentUserId ?? "both");
  const [member, setMember] = useState<string>(defaultMember);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("kind", kind);
    formData.set("member_id", member);
    setOpen(false);
    if (!isEdit) {
      setKind("checkup");
      setMember(currentUserId ?? "both");
    }
    startTransition(async () => {
      try {
        if (isEdit && reminder)
          await updateHealthReminder(reminder.id, formData);
        else await addHealthReminder(formData);
      } catch {
        toast.error("Couldn't save, please try again.");
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isEdit ? "Edit reminder" : "New health reminder"}
          </DialogTitle>
          <DialogDescription>
            A checkup, vaccination, or screening to remember.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map(([value, label]) => (
              <Chip key={value} active={kind === value} onClick={() => setKind(value)}>
                {label}
              </Chip>
            ))}
          </div>

          <Field
            name="title"
            label="What"
            required
            placeholder="e.g. Zobozdravnik kontrola"
            defaultValue={reminder?.title ?? ""}
          />

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">For</Label>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={member === "both"} onClick={() => setMember("both")}>
                Both
              </Chip>
              {members.map((m) => (
                <Chip key={m.id} active={member === m.id} onClick={() => setMember(m.id)}>
                  {m.name}
                </Chip>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field
              name="due_on"
              label="Due date"
              type="date"
              required
              defaultValue={reminder?.due_on ?? ""}
            />
            <Field
              name="interval_months"
              label="Repeat every (months)"
              type="number"
              placeholder="12"
              defaultValue={
                reminder?.interval_months != null
                  ? String(reminder.interval_months)
                  : ""
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hr-notes" className="text-xs text-muted-foreground">
              Notes
            </Label>
            <textarea
              id="hr-notes"
              name="notes"
              rows={2}
              defaultValue={reminder?.notes ?? ""}
              className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isEdit ? "Save" : "Add reminder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs transition-colors",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`hr-${name}`} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={`hr-${name}`}
        name={name}
        type={type}
        min={type === "number" ? "1" : undefined}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        autoComplete="off"
      />
    </div>
  );
}
