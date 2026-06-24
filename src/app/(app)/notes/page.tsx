import type { Metadata } from "next";
import { getNotes } from "@/lib/notes/queries";
import { NotesView } from "@/components/notes/notes-view";

export const metadata: Metadata = { title: "Notes" };

export default async function NotesPage() {
  const notes = await getNotes();
  return <NotesView notes={notes} />;
}
