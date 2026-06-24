"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import type { SubscriptionRow } from "@/lib/subscriptions/queries";
import {
  addSubscription,
  updateSubscription,
} from "@/lib/subscriptions/actions";
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

export type ProviderOption = {
  id: string;
  name: string;
  monthly_cost: number | null;
};

const CADENCES = [
  ["monthly", "Monthly"],
  ["yearly", "Yearly"],
  ["quarterly", "Quarterly"],
  ["weekly", "Weekly"],
] as const;

export function SubscriptionDialog({
  trigger,
  subscription,
  providers,
  open,
  onOpenChange,
}: {
  trigger?: ReactNode;
  subscription?: SubscriptionRow;
  providers: ProviderOption[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = Boolean(subscription?.id);
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [name, setName] = useState(subscription?.name ?? "");
  const [amount, setAmount] = useState(
    subscription?.amount != null ? String(subscription.amount) : "",
  );
  const [cadence, setCadence] = useState(subscription?.cadence ?? "monthly");
  const [providerId, setProviderId] = useState(subscription?.provider_id ?? "");
  const [isPending, startTransition] = useTransition();

  function pickProvider(p: ProviderOption) {
    if (providerId === p.id) {
      setProviderId("");
      return;
    }
    setProviderId(p.id);
    setName(p.name);
    if (p.monthly_cost != null) setAmount(String(p.monthly_cost));
  }

  function handleSubmit(formData: FormData) {
    formData.set("cadence", cadence);
    formData.set("provider_id", providerId);
    startTransition(async () => {
      if (isEdit && subscription)
        await updateSubscription(subscription.id, formData);
      else await addSubscription(formData);
      setOpen(false);
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isEdit ? "Edit subscription" : "Add subscription"}
          </DialogTitle>
          <DialogDescription>
            Recurring payments — bills, subscriptions, memberships.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          {providers.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                From a provider (optional)
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {providers.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => pickProvider(p)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition-colors",
                      providerId === p.id
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="sub-name" className="text-xs text-muted-foreground">
              Name
            </Label>
            <Input
              id="sub-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Netflix, A1, Komunala"
              required
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="sub-amount"
                className="text-xs text-muted-foreground"
              >
                Amount (€)
              </Label>
              <Input
                id="sub-amount"
                name="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                step="0.01"
                min="0"
                placeholder="9.99"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="sub-due"
                className="text-xs text-muted-foreground"
              >
                Next due
              </Label>
              <Input
                id="sub-due"
                name="next_due_on"
                type="date"
                defaultValue={subscription?.next_due_on ?? ""}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Billing</Label>
            <div className="flex flex-wrap gap-1.5">
              {CADENCES.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCadence(value)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
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

          <div className="space-y-1.5">
            <Label htmlFor="sub-notes" className="text-xs text-muted-foreground">
              Notes (optional)
            </Label>
            <Input
              id="sub-notes"
              name="notes"
              defaultValue={subscription?.notes ?? ""}
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isEdit ? "Save" : "Add subscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
