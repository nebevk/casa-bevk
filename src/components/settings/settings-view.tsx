"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  setLocale,
  updateHouseholdSettings,
  updateProfile,
} from "@/lib/settings/actions";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SettingsView({
  displayName,
  householdName,
  currency,
  isOwner,
  locale,
}: {
  displayName: string;
  householdName: string;
  currency: string;
  isOwner: boolean;
  locale: Locale;
}) {
  const t = useT();
  const [isPending, startTransition] = useTransition();

  function pickLocale(next: Locale) {
    if (next === locale) return;
    const fd = new FormData();
    fd.set("locale", next);
    startTransition(() => setLocale(fd));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("settings.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">
            {t("settings.profile")}
          </CardTitle>
          <CardDescription>{t("settings.profileDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={(fd) => startTransition(() => updateProfile(fd))}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="min-w-48 flex-1 space-y-1.5">
              <Label htmlFor="display_name">{t("settings.displayName")}</Label>
              <Input
                id="display_name"
                name="display_name"
                defaultValue={displayName}
                placeholder={t("settings.yourName")}
                autoComplete="off"
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("common.save")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">
            {t("settings.language")}
          </CardTitle>
          <CardDescription>{t("settings.languageDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => pickLocale(code)}
                aria-pressed={locale === code}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  locale === code
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {LOCALE_LABELS[code]}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">
            {t("settings.household")}
          </CardTitle>
          <CardDescription>
            {isOwner
              ? t("settings.householdOwnerDesc")
              : t("settings.householdMemberDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={(fd) => startTransition(() => updateHouseholdSettings(fd))}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="min-w-48 flex-1 space-y-1.5">
              <Label htmlFor="hh-name">{t("settings.householdName")}</Label>
              <Input
                id="hh-name"
                name="name"
                defaultValue={householdName}
                disabled={!isOwner}
                autoComplete="off"
              />
            </div>
            <div className="w-28 space-y-1.5">
              <Label htmlFor="hh-currency">{t("settings.currency")}</Label>
              <Input
                id="hh-currency"
                name="currency"
                defaultValue={currency}
                maxLength={3}
                disabled={!isOwner}
                className="uppercase"
              />
            </div>
            {isOwner && (
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                {t("common.save")}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
