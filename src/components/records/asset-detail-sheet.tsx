"use client";

import { useRef, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { AssetRow, MaintenanceRow } from "@/lib/records/queries";
import {
  addMaintenanceEntry,
  deleteMaintenanceEntry,
} from "@/lib/records/actions";
import { formatDate, formatMoney } from "@/lib/format";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const formRef = useRef<HTMLFormElement>(null);

  const total = entries.reduce((sum, e) => sum + (e.cost ?? 0), 0);
  const isVehicle = asset?.type === "vehicle";

  function handleAdd(formData: FormData) {
    if (!asset) return;
    formData.set("asset_id", asset.id);
    startTransition(async () => {
      await addMaintenanceEntry(formData);
      formRef.current?.reset();
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle className="font-heading">
            {asset?.name ?? "Record"}
          </SheetTitle>
          <SheetDescription>
            Maintenance &amp; expenses · total {formatMoney(total)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 p-5">
          <form
            ref={formRef}
            action={handleAdd}
            className="space-y-2 rounded-lg border border-border bg-card p-3"
          >
            <Input
              name="title"
              placeholder="What was done? (e.g. Oil change)"
              required
              autoComplete="off"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input name="performed_on" type="date" aria-label="Date" />
              <Input
                name="cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="Cost €"
                aria-label="Cost"
              />
              <Input name="vendor" placeholder="Vendor" autoComplete="off" />
              {isVehicle && (
                <Input
                  name="odometer"
                  type="number"
                  min="0"
                  placeholder="Odometer km"
                  aria-label="Odometer"
                />
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
              No entries yet — log a service or expense above.
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
                          ? ` · ${entry.odometer} km`
                          : ""}
                      </p>
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
                          startTransition(() => deleteMaintenanceEntry(entry.id))
                        }
                        className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
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
    </Sheet>
  );
}
