"use client";

import { useRef, useState, useTransition } from "react";
import { CalendarClock, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { AssetRow, MaintenanceRow } from "@/lib/records/queries";
import {
  addMaintenanceEntry,
  deleteMaintenanceEntry,
} from "@/lib/records/actions";
import { daysUntil, formatDate, formatMoney } from "@/lib/format";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AssetDialog } from "./asset-dialog";
import { cn } from "@/lib/utils";

const fmtNum = (v: unknown) =>
  typeof v === "number" ? v.toLocaleString("sl-SI") : String(v ?? "");

export function AssetDetailSheet({
  asset,
  entries,
  open,
  onOpenChange,
}: {
  asset: AssetRow | null;
  entries: MaintenanceRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const total = entries.reduce((sum, e) => sum + (e.cost ?? 0), 0);
  const isVehicle = asset?.type === "vehicle";
  const a = asset?.attributes ?? {};
  const get = (k: string) => a[k];
  const has = (k: string) => {
    const v = a[k];
    return v != null && v !== "";
  };

  function handleAdd(formData: FormData) {
    if (!asset) return;
    formData.set("asset_id", asset.id);
    formRef.current?.reset();
    startTransition(async () => {
      try {
        await addMaintenanceEntry(formData);
      } catch {
        toast.error("Couldn't add entry, please try again.");
      }
    });
  }

  const specPairs: [string, unknown][] = isVehicle
    ? [
        ["Engine", get("engine")],
        ["Power", get("power")],
        ["Gearbox", get("gearbox")],
        ["Fuel", get("fuel")],
        ["Year", get("year")],
        ["Plate", get("plate")],
        ["Engine code", get("engine_code")],
        ["Current km", get("current_km") ? `${fmtNum(get("current_km"))} km` : null],
        ["VIN", get("vin")],
      ]
    : asset?.type === "property"
      ? [
          ["Address", get("address")],
          ["Size", get("size_m2") ? `${get("size_m2")} m²` : null],
        ]
      : [];
  const spec = specPairs.filter(([, v]) => v != null && v !== "");

  const regDays = daysUntil(get("registration_due") as string | null);
  const insDays = daysUntil(get("insurance_due") as string | null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <SheetTitle className="font-heading">
                {asset?.name ?? "Record"}
              </SheetTitle>
              <SheetDescription>
                {entries.length} {entries.length === 1 ? "entry" : "entries"} ·
                total {formatMoney(total)}
              </SheetDescription>
            </div>
            {asset && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-4 p-5">
          {/* Registration & insurance (vehicles) */}
          {isVehicle &&
            (has("registration_due") ||
              has("insurance_due") ||
              has("insurance_company")) && (
              <div className="grid grid-cols-2 gap-2">
                {has("registration_due") && (
                  <KeyDate
                    label="Registration"
                    date={get("registration_due") as string}
                    days={regDays}
                  />
                )}
                {(has("insurance_due") || has("insurance_company")) && (
                  <KeyDate
                    label={`Insurance${
                      get("insurance_company")
                        ? ` · ${get("insurance_company")}`
                        : ""
                    }`}
                    date={(get("insurance_due") as string) ?? null}
                    days={insDays}
                    sub={
                      get("insurance_amount") != null
                        ? `${formatMoney(get("insurance_amount") as number)}/yr`
                        : undefined
                    }
                  />
                )}
              </div>
            )}

          {/* Spec */}
          {spec.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg border border-border bg-card p-3 text-sm">
              {spec.map(([k, v]) => (
                <div key={k} className="flex flex-col">
                  <dt className="text-[11px] text-muted-foreground">{k}</dt>
                  <dd className="truncate font-medium">{String(v)}</dd>
                </div>
              ))}
            </dl>
          )}

          {get("notes") != null && get("notes") !== "" && (
            <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap text-muted-foreground">
              {String(get("notes"))}
            </p>
          )}

          {/* Add service / inspection entry */}
          <form
            ref={formRef}
            action={handleAdd}
            className="space-y-2 rounded-lg border border-border bg-card p-3"
          >
            <Input
              name="title"
              placeholder={
                isVehicle ? "What was done? (e.g. Mali servis)" : "Inspection / work"
              }
              required
              autoComplete="off"
            />
            <div className="grid grid-cols-2 gap-2">
              <LabeledInput label="Date" name="performed_on" type="date" />
              <LabeledInput
                label="Next due"
                name="next_service_on"
                type="date"
              />
              <LabeledInput
                label="Cost €"
                name="cost"
                type="number"
                step="0.01"
              />
              <LabeledInput label="Vendor" name="vendor" />
              {isVehicle && (
                <LabeledInput label="Odometer km" name="odometer" type="number" />
              )}
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="w-full"
            >
              {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
              Add entry
            </Button>
          </form>

          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No entries yet. Log a service or inspection above.
            </p>
          ) : (
            <ul className="space-y-2">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="group rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{entry.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(entry.performed_on)}
                        {entry.vendor ? ` · ${entry.vendor}` : ""}
                        {entry.odometer != null
                          ? ` · ${fmtNum(entry.odometer)} km`
                          : ""}
                      </p>
                      {entry.next_service_on && (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-primary">
                          <CalendarClock className="size-3" />
                          Next: {formatDate(entry.next_service_on)}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {entry.cost != null && (
                        <span className="text-sm font-medium">
                          {formatMoney(entry.cost)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          startTransition(async () => {
                            try {
                              await deleteMaintenanceEntry(entry.id);
                            } catch {
                              toast.error("Couldn't delete, try again.");
                            }
                          })
                        }
                        className="reveal-hover -m-1 rounded-md p-1 text-muted-foreground hover:text-destructive"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>

      {asset && (
        <AssetDialog asset={asset} open={editing} onOpenChange={setEditing} />
      )}
    </Sheet>
  );
}

function KeyDate({
  label,
  date,
  days,
  sub,
}: {
  label: string;
  date: string | null;
  days: number | null;
  sub?: string;
}) {
  const soon = days != null && days >= 0 && days <= 30;
  const overdue = days != null && days < 0;
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        overdue
          ? "border-destructive/40 bg-destructive/5"
          : soon
            ? "border-primary/40 bg-primary/5"
            : "border-border bg-card",
      )}
    >
      <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{date ? formatDate(date) : "—"}</p>
      <p
        className={cn(
          "text-xs",
          overdue
            ? "text-destructive"
            : soon
              ? "text-primary"
              : "text-muted-foreground",
        )}
      >
        {sub ??
          (days == null
            ? ""
            : days < 0
              ? `${Math.abs(days)}d overdue`
              : `in ${days}d`)}
      </p>
    </div>
  );
}

function LabeledInput({
  label,
  name,
  type = "text",
  step,
}: {
  label: string;
  name: string;
  type?: string;
  step?: string;
}) {
  return (
    <Input
      name={name}
      type={type}
      step={step}
      min={type === "number" ? "0" : undefined}
      placeholder={label}
      aria-label={label}
      autoComplete="off"
    />
  );
}
