"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addShoppingItem } from "@/lib/shopping/actions";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function QuickShoppingDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    onOpenChange(false);
    startTransition(async () => {
      try {
        await addShoppingItem(formData);
      } catch {
        toast.error(t("shopping.addError"));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {t("shopping.quickTitle")}
          </DialogTitle>
          <DialogDescription>{t("shopping.quickDesc")}</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <Input
              name="name"
              placeholder={t("shopping.itemPlaceholder")}
              required
              autoFocus
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
          </div>
          <Input
            name="category"
            placeholder={t("shopping.categoryOptionalPlaceholder")}
            autoComplete="off"
          />
          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Loader2 className="animate-spin" />}
              {t("shopping.addItem")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
