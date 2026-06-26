"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AssetRow } from "@/lib/records/queries";
import { addAsset, updateAsset } from "@/lib/records/actions";
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
  { value: "vehicle", label: "Vehicle" },
  { value: "property", label: "Property" },
  { value: "other", label: "Other" },
] as const;

type AssetType = (typeof TYPES)[number]["value"];

export function AssetDialog({
  trigger,
  asset,
  defaultType = "vehicle",
  open,
  onOpenChange,
}: {
  trigger?: ReactNode;
  asset?: AssetRow;
  defaultType?: AssetType;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = Boolean(asset?.id);
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [type, setType] = useState<AssetType>(
    (asset?.type as AssetType) ?? defaultType,
  );
  const [isPending, startTransition] = useTransition();

  const a = asset?.attributes ?? {};
  const attr = (key: string) => {
    const v = a[key];
    return v == null ? "" : String(v);
  };

  function handleSubmit(formData: FormData) {
    formData.set("type", type);
    setOpen(false);
    startTransition(async () => {
      try {
        if (isEdit && asset) await updateAsset(asset.id, formData);
        else await addAsset(formData);
      } catch {
        toast.error("Couldn't save — please try again.");
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isEdit ? "Edit record" : "Add record"}
          </DialogTitle>
          <DialogDescription>
            A vehicle, your apartment, or anything else to keep track of.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          {!isEdit && (
            <div className="flex gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    type === t.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <Field
            name="name"
            label="Name"
            required
            defaultValue={asset?.name ?? ""}
            placeholder={
              type === "vehicle"
                ? "e.g. Škoda Octavia"
                : type === "property"
                  ? "e.g. Apartment"
                  : "Name"
            }
          />

          {type === "vehicle" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Field name="make" label="Make" placeholder="Škoda" defaultValue={attr("make")} />
                <Field name="model" label="Model" placeholder="Octavia III" defaultValue={attr("model")} />
                <Field name="year" label="Year" type="number" placeholder="2015" defaultValue={attr("year")} />
                <Field name="plate" label="Plate" placeholder="LJ-AB-123" defaultValue={attr("plate")} />
                <Field name="engine" label="Engine" placeholder="1.4 TSI" defaultValue={attr("engine")} />
                <Field name="power" label="Power" placeholder="103 kW (140 KM)" defaultValue={attr("power")} />
                <Field name="gearbox" label="Gearbox" placeholder="7-speed DSG" defaultValue={attr("gearbox")} />
                <Field name="fuel" label="Fuel" placeholder="bencin" defaultValue={attr("fuel")} />
                <Field name="engine_code" label="Engine code" placeholder="CHPA" defaultValue={attr("engine_code")} />
                <Field name="current_km" label="Current km" type="number" placeholder="190000" defaultValue={attr("current_km")} />
              </div>
              <Field name="vin" label="VIN" placeholder="TMBAC7NE…" defaultValue={attr("vin")} />

              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Registracija &amp; zavarovanje
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Field name="registration_due" label="Registration due" type="date" defaultValue={attr("registration_due")} />
                  <Field name="insurance_due" label="Insurance renews" type="date" defaultValue={attr("insurance_due")} />
                  <Field name="insurance_company" label="Insurer" placeholder="Triglav" defaultValue={attr("insurance_company")} />
                  <Field name="insurance_amount" label="Yearly premium (€)" type="number" step="0.01" placeholder="420" defaultValue={attr("insurance_amount")} />
                </div>
              </div>
            </>
          )}

          {type === "property" && (
            <div className="grid grid-cols-2 gap-2">
              <Field name="address" label="Address" placeholder="Street, City" defaultValue={attr("address")} />
              <Field name="size_m2" label="Size (m²)" type="number" placeholder="72" defaultValue={attr("size_m2")} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="asset-notes" className="text-xs text-muted-foreground">
              Notes
            </Label>
            <textarea
              id="asset-notes"
              name="notes"
              rows={type === "vehicle" ? 4 : 2}
              defaultValue={attr("notes")}
              placeholder="Observations, quirks, anything to remember…"
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
  defaultValue?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`asset-${name}`} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={`asset-${name}`}
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
