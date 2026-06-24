import type { Metadata } from "next";
import { StickyNote } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Notes" };

export default function NotesPage() {
  return (
    <PagePlaceholder
      title="Notes"
      description="Personal and shared notes — kept private or written together."
      icon={StickyNote}
    />
  );
}
