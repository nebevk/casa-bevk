"use client";

import { useRef, useTransition } from "react";
import { CheckCircle2, Circle, Loader2, Plus, Trash2 } from "lucide-react";
import type { ShoppingItemRow } from "@/lib/shopping/queries";
import {
  addShoppingItem,
  clearCheckedItems,
  deleteShoppingItem,
  toggleShoppingItem,
} from "@/lib/shopping/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Mutate = (fn: () => Promise<void> | void) => void;

export function ShoppingView({ items }: { items: ShoppingItemRow[] }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const mutate: Mutate = (fn) => startTransition(fn);

  const open = items.filter((i) => !i.is_checked);
  const checked = items.filter((i) => i.is_checked);

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      await addShoppingItem(formData);
      formRef.current?.reset();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Shopping
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your shared list — check items off as you go.
          </p>
        </div>
        {checked.length > 0 && (
          <Button
            variant="outline"
            onClick={() => mutate(() => clearCheckedItems())}
            disabled={isPending}
          >
            <Trash2 />
            Clear checked ({checked.length})
          </Button>
        )}
      </div>

      <form
        ref={formRef}
        action={handleAdd}
        className="rounded-lg border border-border bg-card p-3 shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            name="name"
            placeholder="Add an item…"
            required
            autoComplete="off"
            className="flex-1"
          />
          <Input
            name="quantity"
            type="number"
            min="1"
            step="1"
            defaultValue={1}
            aria-label="Quantity"
            className="w-20"
          />
          <Input
            name="category"
            placeholder="Aisle / category"
            autoComplete="off"
            className="sm:w-44"
          />
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
            Add
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        {open.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card/50 py-10 text-center text-sm text-muted-foreground">
            Your list is empty — add something above.
          </p>
        ) : (
          open.map((item) => (
            <ShoppingItem key={item.id} item={item} mutate={mutate} />
          ))
        )}
      </div>

      {checked.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            In the cart ({checked.length})
          </h2>
          {checked.map((item) => (
            <ShoppingItem key={item.id} item={item} mutate={mutate} />
          ))}
        </div>
      )}
    </div>
  );
}

function ShoppingItem({ item, mutate }: { item: ShoppingItemRow; mutate: Mutate }) {
  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm">
      <button
        type="button"
        onClick={() => mutate(() => toggleShoppingItem(item.id, !item.is_checked))}
        className="text-muted-foreground transition-colors hover:text-primary"
        aria-label={item.is_checked ? "Uncheck" : "Check off"}
      >
        {item.is_checked ? (
          <CheckCircle2 className="size-5 text-primary" />
        ) : (
          <Circle className="size-5" />
        )}
      </button>

      <span
        className={cn(
          "flex-1 text-sm",
          item.is_checked && "text-muted-foreground line-through",
        )}
      >
        {item.name}
        {item.quantity > 1 && (
          <span className="ml-2 text-xs text-muted-foreground">
            ×{item.quantity}
          </span>
        )}
      </span>

      {item.category && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {item.category}
        </span>
      )}

      <button
        type="button"
        onClick={() => mutate(() => deleteShoppingItem(item.id))}
        className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
        aria-label="Remove item"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
