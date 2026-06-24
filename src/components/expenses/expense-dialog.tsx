"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import type { Member } from "@/lib/auth/dal";
import { addExpense } from "@/lib/expenses/actions";
import { DEFAULT_EXPENSE_CATEGORIES } from "@/lib/expenses/constants";
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

export function ExpenseDialog({
  trigger,
  members,
  categories = [],
  currentUserId = null,
  open,
  onOpenChange,
}: {
  trigger?: ReactNode;
  members: Member[];
  categories?: string[];
  currentUserId?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const allCategories = Array.from(
    new Set([...DEFAULT_EXPENSE_CATEGORIES, ...categories]),
  );
  const [category, setCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [paidBy, setPaidBy] = useState<string>(currentUserId ?? "none");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("category", category);
    formData.set("paid_by", paidBy);
    startTransition(async () => {
      await addExpense(formData);
      setOpen(false);
      setCategory(DEFAULT_EXPENSE_CATEGORIES[0]);
      setPaidBy(currentUserId ?? "none");
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Add expense</DialogTitle>
          <DialogDescription>
            Jot down a purchase — amount and a category is enough.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="exp-amount">Amount</Label>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
                €
              </span>
              <Input
                id="exp-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                placeholder="0.00"
                required
                autoFocus
                className="pl-7 text-base"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Category</Label>
            <div className="flex flex-wrap gap-1.5">
              {allCategories.map((c) => (
                <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </div>

          {members.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Paid by</Label>
              <div className="flex flex-wrap gap-1.5">
                <Chip active={paidBy === "none"} onClick={() => setPaidBy("none")}>
                  —
                </Chip>
                {members.map((m) => (
                  <Chip
                    key={m.id}
                    active={paidBy === m.id}
                    onClick={() => setPaidBy(m.id)}
                  >
                    {m.name}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-date" className="text-xs text-muted-foreground">
                Date
              </Label>
              <Input id="exp-date" name="occurred_on" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-note" className="text-xs text-muted-foreground">
                Note
              </Label>
              <Input
                id="exp-note"
                name="description"
                placeholder="optional"
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Loader2 className="animate-spin" />}
              Add expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs transition-colors",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
