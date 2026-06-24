import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Expenses" };

export default function ExpensesPage() {
  return (
    <PagePlaceholder
      title="Expenses"
      description="Track who paid for what and see where the money goes."
      icon={Receipt}
    />
  );
}
