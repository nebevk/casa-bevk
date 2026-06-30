"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import type { ProviderRow } from "@/lib/records/queries";
import { addProvider, updateProvider } from "@/lib/records/actions";
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

const TYPES = [
  ["internet", "records.providerType.internet"],
  ["mobile", "records.providerType.mobile"],
  ["tv", "records.providerType.tv"],
  ["electricity", "records.providerType.electricity"],
  ["gas", "records.providerType.gas"],
  ["utility", "records.providerType.utility"],
  ["upravnik", "records.providerType.upravnik"],
  ["komunala", "records.providerType.komunala"],
  ["insurance", "records.providerType.insurance"],
  ["other", "records.providerType.other"],
] as const;

const CADENCES = [
  ["monthly", "records.cadence.monthly"],
  ["yearly", "records.cadence.yearly"],
  ["quarterly", "records.cadence.quarterly"],
  ["weekly", "records.cadence.weekly"],
] as const;

export function ProviderDialog({
  trigger,
  provider,
  open,
  onOpenChange,
}: {
  trigger?: ReactNode;
  provider?: ProviderRow;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const t = useT();
  const isEdit = Boolean(provider?.id);
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [type, setType] = useState(provider?.type ?? "internet");
  const [cadence, setCadence] = useState(provider?.billing_cadence ?? "monthly");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("type", type);
    formData.set("billing_cadence", cadence);
    startTransition(async () => {
      if (isEdit && provider) await updateProvider(provider.id, formData);
      else await addProvider(formData);
      setOpen(false);
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isEdit ? t("records.providerDialog.editTitle") : t("records.providerDialog.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("records.providerDialog.desc")}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors",
                  type === value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {t(label)}
              </button>
            ))}
          </div>

          <Field name="name" label={t("records.field.name")} required placeholder="e.g. Telekom" defaultValue={provider?.name} />
          <Field name="plan" label={t("records.field.plan")} placeholder="e.g. Fiber 1 Gbps" defaultValue={provider?.plan ?? ""} />

          <div className="grid grid-cols-2 gap-3">
            <Field
              name="monthly_cost"
              label={t("records.field.costPerMonth")}
              type="number"
              step="0.01"
              placeholder="29.99"
              defaultValue={provider?.monthly_cost ?? ""}
            />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("records.field.billing")}</Label>
              <div className="flex flex-wrap gap-1">
                {CADENCES.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCadence(value)}
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-xs transition-colors",
                      cadence === value
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {t(label)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Field name="renewal_date" label={t("records.field.renewalDate")} type="date" defaultValue={provider?.renewal_date ?? ""} />
          <Field name="account_number" label={t("records.field.accountNumber")} defaultValue={provider?.account_number ?? ""} />
          <Field name="contact" label={t("records.field.contact")} defaultValue={provider?.contact ?? ""} />
          <Field name="notes" label={t("records.field.notes")} defaultValue={provider?.notes ?? ""} />

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isEdit ? t("records.save") : t("records.addProvider")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
  step,
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  step?: string;
  required?: boolean;
  defaultValue?: string | number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`prov-${name}`} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={`prov-${name}`}
        name={name}
        type={type}
        step={step}
        placeholder={placeholder}
        required={required}
        min={type === "number" ? "0" : undefined}
        defaultValue={defaultValue}
        autoComplete="off"
      />
    </div>
  );
}
