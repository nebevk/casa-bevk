import type { Metadata } from "next";
import { PiggyBank } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Budget" };

export default function BudgetsPage() {
  return (
    <PagePlaceholder
      title="Budget"
      description="Set monthly budgets per category and watch your spending."
      icon={PiggyBank}
    />
  );
}
