"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import type { Member } from "@/lib/auth/dal";
import type { ExpenseRow } from "@/lib/expenses/queries";
import type { MonthInfo } from "@/lib/expenses/month";
import { deleteExpense, setBudget } from "@/lib/expenses/actions";
import { ExpenseDialog } from "@/components/expenses/expense-dialog";
import { formatDate, formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type BudgetRowData = { name: string; budget: number; spent: number };

const hrefFor = (monthKey: string, memberId: string | null) =>
  `/finances?month=${monthKey}${memberId ? `&member=${memberId}` : ""}`;

export function FinancesView({
  month,
  members,
  selectedMember,
  budgetRows,
  expenses,
  categoryName,
  categoryNames,
  memberName,
  currentUserId,
}: {
  month: MonthInfo;
  members: Member[];
  selectedMember: string | null;
  budgetRows: BudgetRowData[];
  expenses: ExpenseRow[];
  categoryName: Record<string, string>;
  categoryNames: string[];
  memberName: Record<string, string>;
  currentUserId: string | null;
}) {
  const totalBudget = budgetRows.reduce((s, r) => s + r.budget, 0);
  const totalSpent = budgetRows.reduce((s, r) => s + r.spent, 0);
  const diff = totalBudget - totalSpent;

  const scopes = [{ id: null as string | null, label: "Shared" }].concat(
    members.map((m) => ({ id: m.id as string | null, label: m.name })),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Finances
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Budget vs spending, by month.
          </p>
        </div>
        <ExpenseDialog
          members={members}
          categories={categoryNames}
          currentUserId={currentUserId}
          trigger={
            <Button>
              <Plus />
              Add expense
            </Button>
          }
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {scopes.map((s) => (
          <Link
            key={s.id ?? "shared"}
            href={hrefFor(month.key, s.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              selectedMember === s.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
        <Link
          href={hrefFor(month.prevKey, selectedMember)}
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
          {totalBudget > 0 && (
            <p
              className={cn(
                "text-xs font-medium tabular-nums",
                diff < 0 ? "text-destructive" : "text-primary",
              )}
            >
              {diff < 0
                ? `${formatMoney(Math.abs(diff))} over`
                : `${formatMoney(diff)} saved`}
            </p>
          )}
        </div>
        <Link
          href={hrefFor(month.nextKey, selectedMember)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Plan vs spending</CardTitle>
          <CardDescription>
            Set a monthly plan per category; see what’s left or over.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {budgetRows.map((row) => (
            <BudgetRow
              key={row.name}
              row={row}
              periodMonth={month.periodMonth}
              memberId={selectedMember}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Expenses</CardTitle>
          <CardDescription>
            {expenses.length} this month
            {selectedMember ? ` · paid by ${memberName[selectedMember]}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No expenses yet — add one or use the quick button in the corner.
            </p>
          ) : (
            <div className="space-y-2">
              {expenses.map((e) => (
                <ExpenseItem
                  key={e.id}
                  expense={e}
                  categoryName={categoryName}
                  memberName={memberName}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BudgetRow({
  row,
  periodMonth,
  memberId,
}: {
  row: BudgetRowData;
  periodMonth: string;
  memberId: string | null;
}) {
  const [value, setValue] = useState(row.budget ? String(row.budget) : "");
  const [, startTransition] = useTransition();
  const pct = row.budget > 0 ? Math.min(100, (row.spent / row.budget) * 100) : 0;
  const over = row.budget > 0 && row.spent > row.budget;
  const remaining = row.budget - row.spent;

  function save() {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0 || amount === row.budget) return;
    startTransition(() => setBudget(row.name, periodMonth, amount, memberId));
  }

  return (
    <div className="rounded-lg border border-border p-3">
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
              aria-label={`Plan for ${row.name}`}
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

function ExpenseItem({
  expense,
  categoryName,
  memberName,
}: {
  expense: ExpenseRow;
  categoryName: Record<string, string>;
  memberName: Record<string, string>;
}) {
  const [, startTransition] = useTransition();
  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {expense.category_id
            ? (categoryName[expense.category_id] ?? "Drugo")
            : "Nerazporejeno"}
          {expense.description ? (
            <span className="font-normal text-muted-foreground">
              {" "}
              · {expense.description}
            </span>
          ) : null}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(expense.occurred_on)}
          {expense.paid_by ? ` · ${memberName[expense.paid_by] ?? ""}` : ""}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums">
        {formatMoney(expense.amount)}
      </span>
      <button
        type="button"
        onClick={() => startTransition(() => deleteExpense(expense.id))}
        className="shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
        aria-label="Delete expense"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
