"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, SETTINGS_ITEM, type NavItem } from "@/lib/constants";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const t = useT();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive(item.href)
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        )}
      >
        <Icon className="size-4 shrink-0" />
        {t(`nav.${item.href.replace("/", "")}`)}
      </Link>
    );
  };

  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map(renderItem)}
      <div className="my-2 h-px bg-sidebar-border" />
      {renderItem(SETTINGS_ITEM)}
    </nav>
  );
}
