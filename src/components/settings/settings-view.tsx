"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  updateHouseholdSettings,
  updateProfile,
} from "@/lib/settings/actions";
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

export function SettingsView({
  displayName,
  householdName,
  currency,
  isOwner,
}: {
  displayName: string;
  householdName: string;
  currency: string;
  isOwner: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your profile and household preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Your profile</CardTitle>
          <CardDescription>How your name shows up across the app.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={(fd) => startTransition(() => updateProfile(fd))}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="min-w-48 flex-1 space-y-1.5">
              <Label htmlFor="display_name">Display name</Label>
              <Input
                id="display_name"
                name="display_name"
                defaultValue={displayName}
                placeholder="Your name"
                autoComplete="off"
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Household</CardTitle>
          <CardDescription>
            {isOwner
              ? "Name and default currency."
              : "Only the household owner can change these."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={(fd) => startTransition(() => updateHouseholdSettings(fd))}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="min-w-48 flex-1 space-y-1.5">
              <Label htmlFor="hh-name">Household name</Label>
              <Input
                id="hh-name"
                name="name"
                defaultValue={householdName}
                disabled={!isOwner}
                autoComplete="off"
              />
            </div>
            <div className="w-28 space-y-1.5">
              <Label htmlFor="hh-currency">Currency</Label>
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
                Save
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
