import type { Metadata } from "next";
import { ShoppingCart } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Shopping" };

export default function ShoppingPage() {
  return (
    <PagePlaceholder
      title="Shopping"
      description="Build shopping lists you both can edit in real time."
      icon={ShoppingCart}
    />
  );
}
