"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { addAsset } from "@/lib/records/actions";
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

export function AssetDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<AssetType>("vehicle");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("type", type);
    startTransition(async () => {
      await addAsset(formData);
      setOpen(false);
      setType("vehicle");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Add record</DialogTitle>
          <DialogDescription>
            A vehicle, your apartment, or anything else to keep track of.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
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

          <Field
            name="name"
            label="Name"
            required
            placeholder={
              type === "vehicle"
                ? "e.g. Our Golf"
                : type === "property"
                  ? "e.g. Apartment"
                  : "Name"
            }
          />

          {type === "vehicle" && (
            <div className="grid grid-cols-2 gap-2">
              <Field name="make" label="Make" placeholder="VW" />
              <Field name="model" label="Model" placeholder="Golf" />
              <Field name="year" label="Year" type="number" placeholder="2019" />
              <Field name="plate" label="Plate" placeholder="SLO-AB-123" />
            </div>
          )}

          {type === "property" && (
            <div className="space-y-2">
              <Field name="address" label="Address" placeholder="Street, City" />
              <Field name="size_m2" label="Size (m²)" type="number" placeholder="72" />
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Add
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
  required,
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
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
        placeholder={placeholder}
        required={required}
        min={type === "number" ? "0" : undefined}
        autoComplete="off"
      />
    </div>
  );
}
