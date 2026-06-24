"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import type { ProviderRow } from "@/lib/records/queries";
import { addProvider, updateProvider } from "@/lib/records/actions";
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
  ["internet", "Internet"],
  ["mobile", "Mobile"],
  ["tv", "TV"],
  ["utility", "Utility"],
  ["insurance", "Insurance"],
  ["other", "Other"],
] as const;

const CADENCES = [
  ["monthly", "Monthly"],
  ["yearly", "Yearly"],
  ["quarterly", "Quarterly"],
  ["weekly", "Weekly"],
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
            {isEdit ? "Edit provider" : "Add provider"}
          </DialogTitle>
          <DialogDescription>
            Internet, mobile, TV, utilities, insurance…
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
                {label}
              </button>
            ))}
          </div>

          <Field name="name" label="Name" required placeholder="e.g. Telekom" defaultValue={provider?.name} />
          <Field name="plan" label="Plan" placeholder="e.g. Fiber 1 Gbps" defaultValue={provider?.plan ?? ""} />

          <div className="grid grid-cols-2 gap-3">
            <Field
              name="monthly_cost"
              label="Cost / month (€)"
              type="number"
              step="0.01"
              placeholder="29.99"
              defaultValue={provider?.monthly_cost ?? ""}
            />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Billing</Label>
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
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Field name="renewal_date" label="Renewal date" type="date" defaultValue={provider?.renewal_date ?? ""} />
          <Field name="account_number" label="Account / customer no." defaultValue={provider?.account_number ?? ""} />
          <Field name="contact" label="Contact (phone / email)" defaultValue={provider?.contact ?? ""} />
          <Field name="notes" label="Notes" defaultValue={provider?.notes ?? ""} />

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isEdit ? "Save" : "Add provider"}
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
