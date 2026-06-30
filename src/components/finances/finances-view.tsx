"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import type { Member } from "@/lib/auth/dal";
import type { ExpenseRow } from "@/lib/expenses/queries";
import type { MonthInfo } from "@/lib/expenses/month";
import { toast } from "sonner";
import { deleteExpense, setBudget } from "@/lib/expenses/actions";
import type { OverviewData } from "@/lib/expenses/overview";
import { ExpenseDialog } from "@/components/expenses/expense-dialog";
import { SpendingOverview } from "@/components/finances/spending-overview";
import { formatDate, formatMoney, parseMoney } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
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

type View = "month" | "overview";

const hrefFor = (monthKey: string, memberId: string | null, view: View) =>
  `/finances?month=${monthKey}` +
  (memberId ? `&member=${memberId}` : "") +
  (view === "overview" ? "&view=overview" : "");

export function FinancesView({
  month,
  view,
  members,
  selectedMember,
  budgetRows,
  expenses,
  overview,
  categoryName,
  categoryNames,
  memberName,
  currentUserId,
}: {
  month: MonthInfo;
  view: View;
  members: Member[];
  selectedMember: string | null;
  budgetRows: BudgetRowData[];
  expenses: ExpenseRow[];
  overview: OverviewData | null;
  categoryName: Record<string, string>;
  categoryNames: string[];
  memberName: Record<string, string>;
  currentUserId: string | null;
}) {
  const t = useT();
  const totalBudget = budgetRows.reduce((s, r) => s + r.budget, 0);
  // Sum the actual (scoped) expense rows so the header reconciles with the list
  // below, including uncategorized spend that has no budget row.
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const diff = totalBudget - totalSpent;

  const scopes = [{ id: null as string | null, label: t("finances.shared") }].concat(
    members.map((m) => ({ id: m.id as string | null, label: m.name })),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("finances.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("finances.subtitle")}
          </p>
        </div>
        <ExpenseDialog
          members={members}
          categories={categoryNames}
          currentUserId={currentUserId}
          trigger={
            <Button>
              <Plus />
              {t("finances.addExpense")}
            </Button>
          }
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(["month", "overview"] as const).map((v) => (
          <Link
            key={v}
            href={hrefFor(month.key, selectedMember, v)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              view === v
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {v === "month" ? t("finances.tabThisMonth") : t("finances.tabOverview")}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {scopes.map((s) => (
          <Link
            key={s.id ?? "shared"}
            href={hrefFor(month.key, s.id, view)}
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
          href={hrefFor(month.prevKey, selectedMember, view)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={t("finances.previousMonth")}
        >
          <ChevronLeft className="size-4" />
        </Link>
        <div className="text-center">
          <p className="text-sm font-medium">{month.label}</p>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">
              {formatMoney(totalSpent)}
            </span>{" "}
            {t("finances.of")} {formatMoney(totalBudget)}
          </p>
          {totalBudget > 0 && (
            <p
              className={cn(
                "text-xs font-medium tabular-nums",
                diff < 0 ? "text-destructive" : "text-primary",
              )}
            >
              {diff < 0
                ? t("finances.amountOver", { amount: formatMoney(Math.abs(diff)) })
                : t("finances.amountSaved", { amount: formatMoney(diff) })}
            </p>
          )}
        </div>
        <Link
          href={hrefFor(month.nextKey, selectedMember, view)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={t("finances.nextMonth")}
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {view === "overview" && overview ? (
        <SpendingOverview overview={overview} />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                {t("finances.planVsSpending")}
              </CardTitle>
              <CardDescription>{t("finances.planVsSpendingDesc")}</CardDescription>
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
              <CardTitle className="font-heading text-lg">
                {t("finances.expenses")}
              </CardTitle>
              <CardDescription>
                {t("finances.expensesThisMonth", { count: expenses.length })}
                {selectedMember
                  ? ` · ${t("finances.paidByName", { name: memberName[selectedMember] })}`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t("finances.noExpenses")}
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
        </>
      )}
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
  const t = useT();
  const initial = row.budget ? String(row.budget) : "";
  const [value, setValue] = useState(initial);
  const [, startTransition] = useTransition();
  const pct = row.budget > 0 ? Math.min(100, (row.spent / row.budget) * 100) : 0;
  const over = row.budget > 0 && row.spent > row.budget;
  const remaining = row.budget - row.spent;

  function save() {
    const trimmed = value.trim();
    // Unchanged input (including still-empty) is a no-op. Emptying the field
    // clears the plan back to 0; any other value is parsed/validated. The amount
    // is re-validated server-side, which is the real trust boundary.
    if (trimmed === initial) return;
    const amount = trimmed === "" ? 0 : parseMoney(trimmed);
    if (amount == null || amount < 0) {
      setValue(initial);
      toast.error(t("finances.invalidAmount"));
      return;
    }
    startTransition(async () => {
      try {
        await setBudget(row.name, periodMonth, trimmed === "" ? "0" : trimmed, memberId);
      } catch {
        setValue(initial);
        toast.error(t("finances.invalidAmount"));
      }
    });
  }

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {row.name}
        </span>
        <div className="flex shrink-0 items-center gap-3">
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
              placeholder={t("finances.plan")}
              className="h-9 w-24 pl-5 text-base md:text-sm"
              aria-label={t("finances.planFor", { name: row.name })}
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
              ? t("finances.amountOver", { amount: formatMoney(Math.abs(remaining)) })
              : t("finances.amountLeft", { amount: formatMoney(remaining) })}
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
  const t = useT();
  const [, startTransition] = useTransition();
  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {expense.category_id
            ? (categoryName[expense.category_id] ?? t("finances.otherCategory"))
            : t("finances.uncategorized")}
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
        className="shrink-0 reveal-hover -m-1 rounded-md p-1 text-muted-foreground hover:text-destructive"
        aria-label={t("finances.deleteExpense")}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
