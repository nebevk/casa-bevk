import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  CalendarDays,
  LayoutDashboard,
  ListTodo,
  PiggyBank,
  Receipt,
  Repeat,
  Settings,
  ShoppingCart,
  StickyNote,
} from "lucide-react";

export const APP_NAME = "Casa Bevk";
export const APP_DESCRIPTION =
  "A private family hub — shared lists, notes, a family calendar, and household finances.";

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
  { label: "Expenses", href: "/expenses", icon: Receipt, description: "Track spending" },
  { label: "Budget", href: "/budgets", icon: PiggyBank, description: "Monthly budgets" },
  { label: "Subscriptions", href: "/subscriptions", icon: Repeat, description: "Recurring payments" },
  { label: "Records", href: "/records", icon: Boxes, description: "Cars, apartment & providers" },
];

export const SETTINGS_ITEM: NavItem = {
  label: "Settings",
  href: "/settings",
  icon: Settings,
  description: "Household & profile",
};
