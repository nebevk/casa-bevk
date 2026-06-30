import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CalendarDays,
  Car,
  Leaf,
  ListTodo,
  Repeat,
  Shield,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  StickyNote,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { getHouseholdMembers, getProfile } from "@/lib/auth/dal";
import { getT } from "@/lib/i18n/server";
import { getTasks } from "@/lib/tasks/queries";
import { getNotes } from "@/lib/notes/queries";
import { getShoppingItems } from "@/lib/shopping/queries";
import { getEvents } from "@/lib/calendar/queries";
import { expandEvents } from "@/lib/calendar/recurrence";
import { getSubscriptions } from "@/lib/subscriptions/queries";
import { getDailyVerse } from "@/lib/dashboard/verse";
import { getWeather } from "@/lib/dashboard/weather";
import { WeatherCard } from "@/components/dashboard/weather-card";
import { getAssets, getMaintenanceEntries } from "@/lib/records/queries";
import { getHealthReminders } from "@/lib/medical/queries";
import { daysUntil, formatDate, formatMoney } from "@/lib/format";
import { ShelfArt } from "@/components/cozy";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

const pad = (n: number) => String(n).padStart(2, "0");

function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return "dashboard.morning";
  if (h < 18) return "dashboard.afternoon";
  return "dashboard.evening";
}

export default async function DashboardPage() {
  const [
    tasks,
    notes,
    items,
    members,
    profile,
    verse,
    events,
    subscriptions,
    assets,
    maintenance,
    healthReminders,
  ] = await Promise.all([
    getTasks(),
    getNotes(),
    getShoppingItems(),
    getHouseholdMembers(),
    getProfile(),
    getDailyVerse(),
    getEvents(),
    getSubscriptions(),
    getAssets(),
    getMaintenanceEntries(),
    getHealthReminders(),
  ]);

  const { t } = await getT();
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

  const in60Days = new Date(now.getTime() + 60 * 86_400_000);
  type Obligation = { id: string; label: string; date: string; icon: LucideIcon };
  const obligations: Obligation[] = [];
  for (const a of assets) {
    if (a.type !== "vehicle") continue;
    const reg = a.attributes.registration_due;
    const ins = a.attributes.insurance_due;
    if (typeof reg === "string")
      obligations.push({ id: `${a.id}-reg`, label: `${a.name} · registracija`, date: reg, icon: Car });
    if (typeof ins === "string")
      obligations.push({ id: `${a.id}-ins`, label: `${a.name} · zavarovanje`, date: ins, icon: Shield });
  }
  for (const e of maintenance) {
    if (e.next_service_on)
      obligations.push({ id: e.id, label: e.title, date: e.next_service_on, icon: Wrench });
  }
  for (const r of healthReminders) {
    obligations.push({ id: r.id, label: r.title, date: r.due_on, icon: Stethoscope });
  }
  const upcomingObligations = obligations
    .filter((o) => new Date(o.date) <= in60Days)
    .sort((x, y) => (x.date < y.date ? -1 : 1))
    .slice(0, 6);

  const stats = [
    { label: t("dashboard.statDueToday"), value: dueToday.length, href: "/tasks", icon: CalendarClock },
    { label: t("dashboard.statOpenTasks"), value: openTasks.length, href: "/tasks", icon: ListTodo },
    { label: t("dashboard.statShopping"), value: openItems.length, href: "/shopping", icon: ShoppingCart },
    { label: t("dashboard.statNotes"), value: notes.length, href: "/notes", icon: StickyNote },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            <span>
              {t(greetingKey())}
              {name ? `, ${name}` : ""}
            </span>
            <Leaf className="size-6 shrink-0 text-primary" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("dashboard.glance")}
          </p>
        </div>
        <ShelfArt className="mt-1 hidden h-12 w-28 shrink-0 text-primary/25 sm:block" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Suspense fallback={<WeatherSkeleton />}>
          <WeatherSlot />
        </Suspense>

        <Card className="border-primary/15 bg-accent/40">
          <CardContent className="flex h-full items-start gap-3.5 py-5">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="font-heading text-base leading-relaxed text-foreground sm:text-lg">
                “{verse.text}”
              </p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {verse.reference}
                {verse.version ? ` · ${verse.version}` : ""}
              </p>
            </div>
          </CardContent>
        </Card>
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
        <Panel title={t("dashboard.dueToday")} description={t("dashboard.dueTodayDesc")}>
          {dueToday.length === 0 ? (
            <Empty>{t("dashboard.nothingDueToday")}</Empty>
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

        <Panel title={t("dashboard.upcoming")} description={t("dashboard.upcomingDesc")} icon={CalendarDays}>
          {upcoming.length === 0 ? (
            <Empty>{t("dashboard.nothingCalendar")}</Empty>
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

        <Panel title={t("dashboard.duePayments")} description={t("dashboard.duePaymentsDesc")} icon={Repeat}>
          {duePayments.length === 0 ? (
            <Empty>{t("dashboard.noPaymentsSoon")}</Empty>
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

        <Panel
          title={t("dashboard.renewals")}
          description={t("dashboard.renewalsDesc")}
          icon={CalendarClock}
        >
          {upcomingObligations.length === 0 ? (
            <Empty>{t("dashboard.nothingComingUp")}</Empty>
          ) : (
            <ul className="space-y-2.5">
              {upcomingObligations.map((o) => {
                const d = daysUntil(o.date);
                const Icon = o.icon;
                return (
                  <li
                    key={o.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="line-clamp-1">{o.label}</span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-xs tabular-nums",
                        d != null && d < 0
                          ? "text-destructive"
                          : d != null && d <= 14
                            ? "text-primary"
                            : "text-muted-foreground",
                      )}
                    >
                      {formatDate(o.date)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title={t("dashboard.recentNotes")} description={t("dashboard.recentNotesDesc")}>
          {recentNotes.length === 0 ? (
            <Empty>{t("dashboard.noNotes")}</Empty>
          ) : (
            <ul className="space-y-2.5">
              {recentNotes.map((note) => (
                <li key={note.id} className="text-sm">
                  <Link
                    href="/notes"
                    className="line-clamp-1 font-medium hover:underline"
                  >
                    {note.title || t("dashboard.untitled")}
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

/** Weather streams in separately so a cold Open-Meteo fetch never blocks paint. */
async function WeatherSlot() {
  const weather = await getWeather();
  return <WeatherCard weather={weather} />;
}

function WeatherSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className="size-10 shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="space-y-2">
          <div className="h-7 w-16 animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-40 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
