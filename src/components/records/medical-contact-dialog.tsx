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
import { useT } from "@/lib/i18n/provider";
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
  ["gp", "records.kind.gp"],
  ["dentist", "records.kind.dentist"],
  ["pediatrician", "records.kind.pediatrician"],
  ["gynecologist", "records.kind.gynecologist"],
  ["specialist", "records.kind.specialist"],
  ["other", "records.kind.other"],
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
  const t = useT();
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
        toast.error(t("records.toast.saveFailed"));
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isEdit ? t("records.contactDialog.editTitle") : t("records.contactDialog.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("records.contactDialog.desc")}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map(([value, label]) => (
              <Chip key={value} active={kind === value} onClick={() => setKind(value)}>
                {t(label)}
              </Chip>
            ))}
          </div>

          <Field name="name" label={t("records.field.name")} required placeholder="dr. Novak" defaultValue={contact?.name ?? ""} />

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("records.for")}</Label>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={member === "both"} onClick={() => setMember("both")}>
                {t("records.both")}
              </Chip>
              {members.map((m) => (
                <Chip key={m.id} active={member === m.id} onClick={() => setMember(m.id)}>
                  {m.name}
                </Chip>
              ))}
            </div>
          </div>

          <Field name="clinic" label={t("records.field.clinic")} placeholder="ZD Radovljica" defaultValue={contact?.clinic ?? ""} />
          <div className="grid grid-cols-2 gap-2">
            <Field name="phone" label={t("records.field.phone")} placeholder="04 …" defaultValue={contact?.phone ?? ""} />
            <Field name="email" label={t("records.field.email")} defaultValue={contact?.email ?? ""} />
          </div>
          <Field name="address" label={t("records.field.address")} defaultValue={contact?.address ?? ""} />

          <div className="space-y-1.5">
            <Label htmlFor="mc-notes" className="text-xs text-muted-foreground">
              {t("records.field.notes")}
            </Label>
            <textarea
              id="mc-notes"
              name="notes"
              rows={2}
              defaultValue={contact?.notes ?? ""}
              className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isEdit ? t("records.save") : t("records.add")}
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
