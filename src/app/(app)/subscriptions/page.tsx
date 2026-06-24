import type { Metadata } from "next";
import { getSubscriptions } from "@/lib/subscriptions/queries";
import { getProviders } from "@/lib/records/queries";
import { SubscriptionsView } from "@/components/subscriptions/subscriptions-view";

export const metadata: Metadata = { title: "Subscriptions" };

export default async function SubscriptionsPage() {
  const [subscriptions, providers] = await Promise.all([
    getSubscriptions(),
    getProviders(),
  ]);
  return (
    <SubscriptionsView
      subscriptions={subscriptions}
      providers={providers.map((p) => ({
        id: p.id,
        name: p.name,
        monthly_cost: p.monthly_cost,
      }))}
    />
  );
}
