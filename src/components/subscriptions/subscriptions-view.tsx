"use client";

import { useTransition } from "react";
import { Check, Pause, Pencil, Play, Plus, Repeat, Trash2 } from "lucide-react";
import type { SubscriptionRow } from "@/lib/subscriptions/queries";
import {
  deleteSubscription,
  markSubscriptionPaid,
  toggleSubscriptionActive,
} from "@/lib/subscriptions/actions";
import {
  SubscriptionDialog,
  type ProviderOption,
} from "./subscription-dialog";
import { daysUntil, formatDate, formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const CADENCE_LABEL: Record<string, string> = {
  daily: "daily",
  weekly: "weekly",
  monthly: "mo",
  quarterly: "quarter",
  yearly: "yr",
  custom: "custom",
};

function monthlyEquivalent(amount: number, cadence: string): number {
  switch (cadence) {
    case "yearly":
      return amount / 12;
    case "quarterly":
      return amount / 3;
    case "weekly":
      return (amount * 52) / 12;
    case "daily":
      return amount * 30;
    default:
      return amount;
  }
}

export function SubscriptionsView({
  subscriptions,
  providers,
}: {
  subscriptions: SubscriptionRow[];
  providers: ProviderOption[];
}) {
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<SubscriptionRow | null>(null);
  const mutate = (fn: () => Promise<void> | void) => startTransition(fn);

  const monthlyTotal = subscriptions
    .filter((s) => s.is_active)
    .reduce((sum, s) => sum + monthlyEquivalent(s.amount, s.cadence), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Subscriptions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Recurring payments ·{" "}
            <span className="font-medium text-foreground">
              ≈ {formatMoney(monthlyTotal)}/mo
            </span>
          </p>
        </div>
        <SubscriptionDialog
          providers={providers}
          trigger={
            <Button>
              <Plus />
              Add subscription
            </Button>
          }
        />
      </div>

      {subscriptions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/50 py-16 text-center">
          <Repeat className="mx-auto size-8 text-muted-foreground/60" />
          <p className="mt-2 text-sm text-muted-foreground">
            No subscriptions yet — add internet, streaming, insurance…
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {subscriptions.map((s) => {
            const days = daysUntil(s.next_due_on);
            return (
              <div
                key={s.id}
                className={cn(
                  "group flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm",
                  !s.is_active && "opacity-60",
                )}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Repeat className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(s.amount)}/{CADENCE_LABEL[s.cadence] ?? s.cadence}
                    {s.next_due_on
                      ? ` · ${
                          days != null && days >= 0
                            ? `due in ${days}d`
                            : `due ${formatDate(s.next_due_on)}`
                        }`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {s.is_active && s.next_due_on && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => mutate(() => markSubscriptionPaid(s.id))}
                    >
                      <Check />
                      Paid
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditing(s)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Edit"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      mutate(() => toggleSubscriptionActive(s.id, !s.is_active))
                    }
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={s.is_active ? "Pause" : "Resume"}
                  >
                    {s.is_active ? (
                      <Pause className="size-4" />
                    ) : (
                      <Play className="size-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => mutate(() => deleteSubscription(s.id))}
                    className="rounded-md p-1.5 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <SubscriptionDialog
          subscription={editing}
          providers={providers}
          open
          onOpenChange={(o) => {
            if (!o) setEditing(null);
          }}
        />
      )}
    </div>
  );
}
