import type { Metadata } from "next";
import {
  getAssets,
  getMaintenanceEntries,
  getProviders,
} from "@/lib/records/queries";
import { RecordsView } from "@/components/records/records-view";

export const metadata: Metadata = { title: "Records" };

export default async function RecordsPage() {
  const [assets, entries, providers] = await Promise.all([
    getAssets(),
    getMaintenanceEntries(),
    getProviders(),
  ]);
  return (
    <RecordsView assets={assets} entries={entries} providers={providers} />
  );
}
