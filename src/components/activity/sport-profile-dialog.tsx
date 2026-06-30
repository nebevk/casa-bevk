"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SportProfile } from "@/lib/activity/queries";
import { saveSportProfile } from "@/lib/activity/actions";
import { useT } from "@/lib/i18n/provider";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SportProfileDialog({
  profile,
  memberId,
  memberName,
  open,
  onOpenChange,
}: {
  profile?: SportProfile | null;
  memberId: string | null;
  memberName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [url, setUrl] = useState(profile?.url ?? "");
  const [label, setLabel] = useState(profile?.label ?? "");
  const [isPending, startTransition] = useTransition();
  const t = useT();

  function submit() {
    if (!url.trim()) return;
    const fd = new FormData();
    if (profile) fd.set("id", profile.id);
    if (memberId) fd.set("member_id", memberId);
    fd.set("url", url.trim());
    fd.set("label", label.trim());
    startTransition(async () => {
      try {
        await saveSportProfile(fd);
        onOpenChange(false);
      } catch {
        toast.error(t("activity.toast.saveProfileFailed"));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Strava{memberName ? ` · ${memberName}` : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="sp-url">{t("activity.profileLink")}</Label>
            <Input
              id="sp-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="strava.com/athletes/123456"
              autoComplete="off"
              inputMode="url"
            />
            <p className="text-xs text-muted-foreground">
              {t("activity.profileLinkHint")}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sp-label">{t("activity.labelOptional")}</Label>
            <Input
              id="sp-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("activity.labelPlaceholder")}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter showCloseButton>
          <Button
            type="button"
            onClick={submit}
            disabled={isPending || !url.trim()}
          >
            {isPending && <Loader2 className="animate-spin" />}
            {t("activity.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
