import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarClock,
  Leaf,
  ListTodo,
  ShoppingCart,
  StickyNote,
} from "lucide-react";
import { getHouseholdMembers, getProfile } from "@/lib/auth/dal";
import { getTasks } from "@/lib/tasks/queries";
import { getNotes } from "@/lib/notes/queries";
import { getShoppingItems } from "@/lib/shopping/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const [tasks, notes, items, members, profile] = await Promise.all([
    getTasks(),
    getNotes(),
    getShoppingItems(),
    getHouseholdMembers(),
    getProfile(),
  ]);

  const name = (profile as { display_name?: string } | null)?.display_name;
  const memberName = new Map(members.map((m) => [m.id, m.name] as const));

  const openTasks = tasks.filter((t) => !t.is_done);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const dueToday = openTasks
    .filter((t) => t.due_at && new Date(t.due_at) <= endOfToday)
    .sort((a, b) => (a.due_at! < b.due_at! ? -1 : 1));
  const openItems = items.filter((i) => !i.is_checked);
  const recentNotes = notes.slice(0, 4);

  const stats = [
    { label: "Due today", value: dueToday.length, href: "/tasks", icon: CalendarClock },
    { label: "Open tasks", value: openTasks.length, href: "/tasks", icon: ListTodo },
    { label: "Shopping", value: openItems.length, href: "/shopping", icon: ShoppingCart },
    { label: "Notes", value: notes.length, href: "/notes", icon: StickyNote },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          <span>
            {greeting()}
            {name ? `, ${name}` : ""}
          </span>
          <Leaf className="size-6 shrink-0 text-primary" />
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here’s your household at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="block">
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-semibold tabular-nums">
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                  <Icon className="size-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Due today</CardTitle>
            <CardDescription>Tasks due today or overdue.</CardDescription>
          </CardHeader>
          <CardContent>
            {dueToday.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing due today — you’re all caught up.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {dueToday.slice(0, 6).map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="line-clamp-1">{task.title}</span>
                    {task.assignee_id && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {memberName.get(task.assignee_id)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Recent notes</CardTitle>
            <CardDescription>The latest notes you can see.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentNotes.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No notes yet.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {recentNotes.map((note) => (
                  <li key={note.id} className="text-sm">
                    <Link
                      href="/notes"
                      className="line-clamp-1 font-medium hover:underline"
                    >
                      {note.title || "Untitled"}
                    </Link>
                    {note.body && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {note.body}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        More coming soon — Calendar, Expenses, Budget &amp; Subscriptions.
      </p>
    </div>
  );
}
