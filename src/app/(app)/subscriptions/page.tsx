import type { Metadata } from "next";
import { Repeat } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Subscriptions" };

export default function SubscriptionsPage() {
  return (
    <PagePlaceholder
      title="Subscriptions"
      description="Keep track of recurring payments and when they're due."
      icon={Repeat}
    />
  );
}
