import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  CalendarDays,
  LayoutDashboard,
  ListTodo,
  Repeat,
  Settings,
  ShoppingCart,
  StickyNote,
  Wallet,
} from "lucide-react";

export const APP_NAME = "Casa Bevk";
export const APP_DESCRIPTION =
  "A private family hub: shared lists, notes, a family calendar, and household finances.";

/**
 * The two household members. Casa Bevk is invite-only (no public sign-up), so
 * these are the only accounts that exist. Surfaced as quick-login chips so
 * logging in is one tap + password. Only `key`/`name` live here (client-safe);
 * the real email addresses are resolved server-side in lib/auth/members.ts so
 * they never ship in the public login bundle.
 */
export type HouseholdMember = { key: string; name: string };

export const HOUSEHOLD_MEMBERS: HouseholdMember[] = [
  { key: "eva", name: "Eva" },
  { key: "nejc", name: "Nejc" },
];

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

/** Primary navigation, in sidebar order. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Your daily overview" },
  { label: "To-Do", href: "/tasks", icon: ListTodo, description: "Shared task lists" },
  { label: "Shopping", href: "/shopping", icon: ShoppingCart, description: "Shopping lists" },
  { label: "Notes", href: "/notes", icon: StickyNote, description: "Personal & shared notes" },
  { label: "Calendar", href: "/calendar", icon: CalendarDays, description: "Family calendar & reminders" },
  { label: "Finances", href: "/finances", icon: Wallet, description: "Expenses & budget" },
  { label: "Subscriptions", href: "/subscriptions", icon: Repeat, description: "Recurring payments" },
  { label: "Records", href: "/records", icon: Boxes, description: "Cars, apartment & providers" },
];

export const SETTINGS_ITEM: NavItem = {
  label: "Settings",
  href: "/settings",
  icon: Settings,
  description: "Household & profile",
};
