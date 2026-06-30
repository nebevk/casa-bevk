"use client";

import { useOptimistic, useRef, useTransition } from "react";
import { CheckCircle2, Circle, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ShoppingItemRow } from "@/lib/shopping/queries";
import {
  addShoppingItem,
  clearCheckedItems,
  deleteShoppingItem,
  toggleShoppingItem,
} from "@/lib/shopping/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CozyEmpty, MugArt } from "@/components/cozy";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type OptimisticAction =
  | { kind: "toggle"; id: string }
  | { kind: "delete"; id: string }
  | { kind: "clear" }
  | { kind: "add"; item: ShoppingItemRow };

function applyOptimistic(
  state: ShoppingItemRow[],
  action: OptimisticAction,
): ShoppingItemRow[] {
  switch (action.kind) {
    case "toggle":
      return state.map((i) =>
        i.id === action.id ? { ...i, is_checked: !i.is_checked } : i,
      );
    case "delete":
      return state.filter((i) => i.id !== action.id);
    case "clear":
      return state.filter((i) => !i.is_checked);
    case "add":
      return [...state, action.item];
  }
}

export function ShoppingView({ items }: { items: ShoppingItemRow[] }) {
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const [optimisticItems, optimize] = useOptimistic(items, applyOptimistic);
  const formRef = useRef<HTMLFormElement>(null);

  // Optimistic update first (instant), then sync to the server in the background.
  function run(action: OptimisticAction, mutate: () => Promise<void>) {
    startTransition(async () => {
      optimize(action);
      try {
        await mutate();
      } catch {
        toast.error(t("shopping.saveError"));
      }
    });
  }

  const open = optimisticItems.filter((i) => !i.is_checked);
  const checked = optimisticItems.filter((i) => i.is_checked);

  function handleAdd(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;
    const qty = Number(formData.get("quantity"));
    const quantity = Number.isFinite(qty) && qty > 0 ? qty : 1;
    const category = String(formData.get("category") ?? "").trim() || null;
    formRef.current?.reset();
    run(
      {
        kind: "add",
        item: {
          id: `temp-${crypto.randomUUID()}`,
          name,
          quantity,
          category,
          is_checked: false,
        },
      },
      () => addShoppingItem(formData),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("shopping.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("shopping.subtitle")}
          </p>
        </div>
        {checked.length > 0 && (
          <Button
            variant="outline"
            onClick={() => run({ kind: "clear" }, () => clearCheckedItems())}
            disabled={isPending}
          >
            <Trash2 />
            {t("shopping.clearChecked", { count: checked.length })}
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
            placeholder={t("shopping.addItemPlaceholder")}
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
            aria-label={t("shopping.quantity")}
            className="w-20"
          />
          <Input
            name="category"
            placeholder={t("shopping.categoryPlaceholder")}
            autoComplete="off"
            className="sm:w-44"
          />
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
            {t("shopping.add")}
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        {open.length === 0 ? (
          <CozyEmpty art={<MugArt />}>{t("shopping.empty")}</CozyEmpty>
        ) : (
          open.map((item) => (
            <ShoppingItem key={item.id} item={item} run={run} />
          ))
        )}
      </div>

      {checked.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("shopping.inTheCart", { count: checked.length })}
          </h2>
          {checked.map((item) => (
            <ShoppingItem key={item.id} item={item} run={run} />
          ))}
        </div>
      )}
    </div>
  );
}

function ShoppingItem({
  item,
  run,
}: {
  item: ShoppingItemRow;
  run: (action: OptimisticAction, mutate: () => Promise<void>) => void;
}) {
  const t = useT();
  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm">
      <button
        type="button"
        onClick={() =>
          run({ kind: "toggle", id: item.id }, () =>
            toggleShoppingItem(item.id, !item.is_checked),
          )
        }
        className="text-muted-foreground transition-colors hover:text-primary"
        aria-label={item.is_checked ? t("shopping.uncheck") : t("shopping.checkOff")}
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
        onClick={() =>
          run({ kind: "delete", id: item.id }, () =>
            deleteShoppingItem(item.id),
          )
        }
        className="reveal-hover -m-1 rounded-md p-1 text-muted-foreground hover:text-destructive"
        aria-label={t("shopping.removeItem")}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
