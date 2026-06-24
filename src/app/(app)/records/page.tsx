import type { Metadata } from "next";
import { Boxes } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Records" };

export default function RecordsPage() {
  return (
    <PagePlaceholder
      title="Records"
      description="Cars, the apartment, and providers — info, maintenance logs, and costs in one place."
      icon={Boxes}
    />
  );
}
