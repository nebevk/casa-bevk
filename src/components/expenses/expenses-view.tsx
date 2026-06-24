"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import type { Member } from "@/lib/auth/dal";
import type { ExpenseRow } from "@/lib/expenses/queries";
import type { MonthInfo } from "@/lib/expenses/month";
import { deleteExpense } from "@/lib/expenses/actions";
import { ExpenseDialog } from "./expense-dialog";
import { formatDate, formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";

export function ExpensesView({
  expenses,
  categoryName,
  categoryNames,
  memberName,
  members,
  currentUserId,
  month,
}: {
  expenses: ExpenseRow[];
  categoryName: Record<string, string>;
  categoryNames: string[];
  memberName: Record<string, string>;
  members: Member[];
  currentUserId: string | null;
  month: MonthInfo;
}) {
  const [, startTransition] = useTransition();
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Expenses
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every purchase, by category.
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

      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
        <Link
          href={`/expenses?month=${month.prevKey}`}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <div className="text-center">
          <p className="text-sm font-medium">{month.label}</p>
          <p className="text-lg font-semibold tabular-nums">
            {formatMoney(total)}
          </p>
        </div>
        <Link
          href={`/expenses?month=${month.nextKey}`}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {expenses.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card/50 py-12 text-center text-sm text-muted-foreground">
          No expenses this month — add one, or use the quick button in the corner.
        </p>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <div
              key={e.id}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {e.category_id
                    ? (categoryName[e.category_id] ?? "Drugo")
                    : "Nerazporejeno"}
                  {e.description ? (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      · {e.description}
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(e.occurred_on)}
                  {e.paid_by ? ` · ${memberName[e.paid_by] ?? ""}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {formatMoney(e.amount)}
              </span>
              <button
                type="button"
                onClick={() => startTransition(() => deleteExpense(e.id))}
                className="shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                aria-label="Delete expense"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
