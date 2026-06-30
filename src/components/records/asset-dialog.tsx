"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AssetRow } from "@/lib/records/queries";
import { addAsset, updateAsset } from "@/lib/records/actions";
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
  { value: "vehicle", labelKey: "records.assetType.vehicle" },
  { value: "property", labelKey: "records.assetType.property" },
  { value: "other", labelKey: "records.assetType.other" },
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
  const t = useT();
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
        toast.error(t("records.toast.saveFailed"));
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isEdit ? t("records.assetDialog.editTitle") : t("records.assetDialog.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("records.assetDialog.desc")}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          {!isEdit && (
            <div className="flex gap-2">
              {TYPES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    type === opt.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          )}

          <Field
            name="name"
            label={t("records.field.name")}
            required
            defaultValue={asset?.name ?? ""}
            placeholder={
              type === "vehicle"
                ? t("records.placeholder.vehicleName")
                : type === "property"
                  ? t("records.placeholder.propertyName")
                  : t("records.field.name")
            }
          />

          {type === "vehicle" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Field name="make" label={t("records.field.make")} placeholder="Škoda" defaultValue={attr("make")} />
                <Field name="model" label={t("records.field.model")} placeholder="Octavia III" defaultValue={attr("model")} />
                <Field name="year" label={t("records.field.year")} type="number" placeholder="2015" defaultValue={attr("year")} />
                <Field name="plate" label={t("records.field.plate")} placeholder="LJ-AB-123" defaultValue={attr("plate")} />
                <Field name="engine" label={t("records.field.engine")} placeholder="1.4 TSI" defaultValue={attr("engine")} />
                <Field name="power" label={t("records.field.power")} placeholder="103 kW (140 KM)" defaultValue={attr("power")} />
                <Field name="gearbox" label={t("records.field.gearbox")} placeholder="7-speed DSG" defaultValue={attr("gearbox")} />
                <Field name="fuel" label={t("records.field.fuel")} placeholder="bencin" defaultValue={attr("fuel")} />
                <Field name="engine_code" label={t("records.field.engineCode")} placeholder="CHPA" defaultValue={attr("engine_code")} />
                <Field name="current_km" label={t("records.field.currentKm")} type="number" placeholder="190000" defaultValue={attr("current_km")} />
              </div>
              <Field name="vin" label={t("records.field.vin")} placeholder="TMBAC7NE…" defaultValue={attr("vin")} />

              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {t("records.regInsHeading")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Field name="registration_due" label={t("records.field.registrationDue")} type="date" defaultValue={attr("registration_due")} />
                  <Field name="insurance_due" label={t("records.field.insuranceRenews")} type="date" defaultValue={attr("insurance_due")} />
                  <Field name="insurance_company" label={t("records.field.insurer")} placeholder="Triglav" defaultValue={attr("insurance_company")} />
                  <Field name="insurance_amount" label={t("records.field.yearlyPremium")} type="number" step="0.01" placeholder="420" defaultValue={attr("insurance_amount")} />
                </div>
              </div>
            </>
          )}

          {type === "property" && (
            <div className="grid grid-cols-2 gap-2">
              <Field name="address" label={t("records.field.address")} placeholder={t("records.placeholder.streetCity")} defaultValue={attr("address")} />
              <Field name="size_m2" label={t("records.field.sizeM2")} type="number" placeholder="72" defaultValue={attr("size_m2")} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="asset-notes" className="text-xs text-muted-foreground">
              {t("records.field.notes")}
            </Label>
            <textarea
              id="asset-notes"
              name="notes"
              rows={type === "vehicle" ? 4 : 2}
              defaultValue={attr("notes")}
              placeholder={t("records.placeholder.assetNotes")}
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
