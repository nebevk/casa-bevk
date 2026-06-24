import type { Metadata } from "next";
import { getHouseholdMembers, getProfile, getUser } from "@/lib/auth/dal";
import { getHouseholdSettings } from "@/lib/settings/queries";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [profile, settings, members, user] = await Promise.all([
    getProfile(),
    getHouseholdSettings(),
    getHouseholdMembers(),
    getUser(),
  ]);
  const displayName =
    (profile as { display_name?: string } | null)?.display_name ?? "";
  const isOwner =
    members.find((m) => m.id === user?.id)?.role === "owner";

  return (
    <SettingsView
      displayName={displayName}
      householdName={settings?.name ?? "Our Home"}
      currency={settings?.currency ?? "EUR"}
      isOwner={isOwner}
    />
  );
}
