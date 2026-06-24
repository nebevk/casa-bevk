"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MonthInfo } from "@/lib/expenses/month";
import { setBudget } from "@/lib/expenses/actions";
import { formatMoney } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type BudgetRowData = { name: string; budget: number; spent: number };

export function BudgetView({
  rows,
  month,
}: {
  rows: BudgetRowData[];
  month: MonthInfo;
}) {
  const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Budget
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set a monthly plan per category and track it against spending.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
        <Link
          href={`/budgets?month=${month.prevKey}`}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <div className="text-center">
          <p className="text-sm font-medium">{month.label}</p>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">
              {formatMoney(totalSpent)}
            </span>{" "}
            of {formatMoney(totalBudget)}
          </p>
        </div>
        <Link
          href={`/budgets?month=${month.nextKey}`}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <BudgetRow key={row.name} row={row} periodMonth={month.periodMonth} />
        ))}
      </div>
    </div>
  );
}

function BudgetRow({
  row,
  periodMonth,
}: {
  row: BudgetRowData;
  periodMonth: string;
}) {
  const [value, setValue] = useState(row.budget ? String(row.budget) : "");
  const [, startTransition] = useTransition();
  const pct = row.budget > 0 ? Math.min(100, (row.spent / row.budget) * 100) : 0;
  const over = row.budget > 0 && row.spent > row.budget;
  const remaining = row.budget - row.spent;

  function save() {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0 || amount === row.budget) return;
    startTransition(() => setBudget(row.name, periodMonth, amount));
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{row.name}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatMoney(row.spent)}
            {row.budget > 0 && ` / ${formatMoney(row.budget)}`}
          </span>
          <div className="relative">
            <span className="absolute top-1/2 left-2 -translate-y-1/2 text-xs text-muted-foreground">
              €
            </span>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              type="number"
              min="0"
              step="1"
              placeholder="Plan"
              className="h-8 w-24 pl-5 text-sm"
              aria-label={`Budget for ${row.name}`}
            />
          </div>
        </div>
      </div>
      {row.budget > 0 && (
        <>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full",
                over ? "bg-destructive" : "bg-primary",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p
            className={cn(
              "mt-1 text-xs tabular-nums",
              over ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {over
              ? `${formatMoney(Math.abs(remaining))} over`
              : `${formatMoney(remaining)} left`}
          </p>
        </>
      )}
    </div>
  );
}
