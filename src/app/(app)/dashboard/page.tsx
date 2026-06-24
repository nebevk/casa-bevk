import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarClock,
  CalendarDays,
  Leaf,
  ListTodo,
  Repeat,
  ShoppingCart,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { getHouseholdMembers, getProfile } from "@/lib/auth/dal";
import { getTasks } from "@/lib/tasks/queries";
import { getNotes } from "@/lib/notes/queries";
import { getShoppingItems } from "@/lib/shopping/queries";
import { getEvents } from "@/lib/calendar/queries";
import { expandEvents } from "@/lib/calendar/recurrence";
import { getSubscriptions } from "@/lib/subscriptions/queries";
import { getDailyVerse } from "@/lib/dashboard/verse";
import { daysUntil, formatMoney } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

const pad = (n: number) => String(n).padStart(2, "0");

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const [tasks, notes, items, members, profile, verse, events, subscriptions] =
    await Promise.all([
      getTasks(),
      getNotes(),
      getShoppingItems(),
      getHouseholdMembers(),
      getProfile(),
      getDailyVerse(),
      getEvents(),
      getSubscriptions(),
    ]);

  const name = (profile as { display_name?: string } | null)?.display_name;
  const memberName = new Map(members.map((m) => [m.id, m.name] as const));

  const openTasks = tasks.filter((t) => !t.is_done);
  const now = new Date();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const in14Days = new Date(now.getTime() + 14 * 86_400_000);

  const dueToday = openTasks
    .filter((t) => t.due_at && new Date(t.due_at) <= endOfToday)
    .sort((a, b) => (a.due_at! < b.due_at! ? -1 : 1));
  const openItems = items.filter((i) => !i.is_checked);
  const recentNotes = notes.slice(0, 4);
  const upcoming = expandEvents(events, now, in14Days).slice(0, 5);
  const duePayments = subscriptions
    .filter(
      (s) => s.is_active && s.next_due_on && new Date(s.next_due_on) <= in14Days,
    )
    .slice(0, 5);

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

      <Card className="border-primary/15 bg-accent/40">
        <CardContent className="flex items-start gap-3.5 py-5">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="font-heading text-base leading-relaxed text-foreground sm:text-lg">
              “{verse.text}”
            </p>
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              — {verse.reference}
              {verse.version ? ` · ${verse.version}` : ""}
            </p>
          </div>
        </CardContent>
      </Card>

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
        <Panel title="Due today" description="Tasks due today or overdue.">
          {dueToday.length === 0 ? (
            <Empty>Nothing due today — you’re all caught up.</Empty>
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
        </Panel>

        <Panel title="Upcoming" description="Events in the next two weeks." icon={CalendarDays}>
          {upcoming.length === 0 ? (
            <Empty>Nothing on the calendar yet.</Empty>
          ) : (
            <ul className="space-y-2.5">
              {upcoming.map((o, i) => (
                <li
                  key={`${o.event.id}-${i}`}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="line-clamp-1">{o.event.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {o.start.toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                    {!o.event.all_day &&
                      ` ${pad(o.start.getHours())}:${pad(o.start.getMinutes())}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Due payments" description="Subscriptions coming up." icon={Repeat}>
          {duePayments.length === 0 ? (
            <Empty>No payments due soon.</Empty>
          ) : (
            <ul className="space-y-2.5">
              {duePayments.map((s) => {
                const d = daysUntil(s.next_due_on);
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="line-clamp-1">{s.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {formatMoney(s.amount)}
                      {d != null && d >= 0 ? ` · ${d}d` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Recent notes" description="The latest notes you can see.">
          {recentNotes.length === 0 ? (
            <Empty>No notes yet.</Empty>
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
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-lg">{title}</CardTitle>
          {Icon && <Icon className="size-4 text-muted-foreground" />}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>
  );
}
