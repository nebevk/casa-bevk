import type { Metadata } from "next";
import { getHouseholdMembers, getUser } from "@/lib/auth/dal";
import {
  getAssets,
  getMaintenanceEntries,
  getProviders,
} from "@/lib/records/queries";
import { getHealthReminders, getMedicalContacts } from "@/lib/medical/queries";
import { RecordsView } from "@/components/records/records-view";

export const metadata: Metadata = { title: "Records" };

export default async function RecordsPage() {
  const [
    assets,
    entries,
    providers,
    medicalContacts,
    healthReminders,
    members,
    user,
  ] = await Promise.all([
    getAssets(),
    getMaintenanceEntries(),
    getProviders(),
    getMedicalContacts(),
    getHealthReminders(),
    getHouseholdMembers(),
    getUser(),
  ]);
  return (
    <RecordsView
      assets={assets}
      entries={entries}
      providers={providers}
      medicalContacts={medicalContacts}
      healthReminders={healthReminders}
      members={members}
      currentUserId={user?.id ?? null}
    />
  );
}
