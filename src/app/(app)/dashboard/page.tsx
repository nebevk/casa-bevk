import type { Metadata } from "next";
import { CalendarDays, Leaf, ListTodo, PiggyBank, Repeat } from "lucide-react";
import { getProfile } from "@/lib/auth/dal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

const SUMMARY_CARDS = [
  {
    title: "Today's Tasks",
    icon: ListTodo,
    empty: "No tasks due today.",
    hint: "Shared to-dos due today will appear here.",
  },
  {
    title: "Upcoming Events",
    icon: CalendarDays,
    empty: "Nothing on the calendar.",
    hint: "The next few days of family events.",
  },
  {
    title: "Budget Snapshot",
    icon: PiggyBank,
    empty: "No budget set yet.",
    hint: "This month's spending vs. budget.",
  },
  {
    title: "Due Payments",
    icon: Repeat,
    empty: "No payments due.",
    hint: "Subscriptions & bills coming up.",
  },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const profile = await getProfile();
  const name = (profile as { display_name?: string } | null)?.display_name;

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
        {SUMMARY_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <Icon className="size-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">{card.empty}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Recent activity</CardTitle>
          <CardDescription>
            What you and your partner have been up to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-6 text-center text-sm text-muted-foreground">
            Activity will appear here as you start using Casa Bevk.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
