"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Member } from "@/lib/auth/dal";
import type { MedicalContactRow } from "@/lib/medical/queries";
import {
  addMedicalContact,
  updateMedicalContact,
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
  ["gp", "GP"],
  ["dentist", "Dentist"],
  ["pediatrician", "Pediatrician"],
  ["gynecologist", "Gynecologist"],
  ["specialist", "Specialist"],
  ["other", "Other"],
] as const;

export function MedicalContactDialog({
  trigger,
  contact,
  members,
  open,
  onOpenChange,
}: {
  trigger?: ReactNode;
  contact?: MedicalContactRow;
  members: Member[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = Boolean(contact?.id);
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [kind, setKind] = useState<string>(contact?.kind ?? "gp");
  const [member, setMember] = useState<string>(contact?.member_id ?? "both");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("kind", kind);
    formData.set("member_id", member);
    setOpen(false);
    if (!isEdit) {
      setKind("gp");
      setMember("both");
    }
    startTransition(async () => {
      try {
        if (isEdit && contact)
          await updateMedicalContact(contact.id, formData);
        else await addMedicalContact(formData);
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
            {isEdit ? "Edit contact" : "Add doctor / dentist"}
          </DialogTitle>
          <DialogDescription>
            A doctor, dentist, or other medical contact.
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

          <Field name="name" label="Name" required placeholder="dr. Novak" defaultValue={contact?.name ?? ""} />

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

          <Field name="clinic" label="Clinic / ZD" placeholder="ZD Radovljica" defaultValue={contact?.clinic ?? ""} />
          <div className="grid grid-cols-2 gap-2">
            <Field name="phone" label="Phone" placeholder="04 …" defaultValue={contact?.phone ?? ""} />
            <Field name="email" label="Email" defaultValue={contact?.email ?? ""} />
          </div>
          <Field name="address" label="Address" defaultValue={contact?.address ?? ""} />

          <div className="space-y-1.5">
            <Label htmlFor="mc-notes" className="text-xs text-muted-foreground">
              Notes
            </Label>
            <textarea
              id="mc-notes"
              name="notes"
              rows={2}
              defaultValue={contact?.notes ?? ""}
              className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isEdit ? "Save" : "Add"}
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
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`mc-${name}`} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={`mc-${name}`}
        name={name}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        autoComplete="off"
      />
    </div>
  );
}
