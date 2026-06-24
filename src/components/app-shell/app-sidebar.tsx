import { APP_NAME } from "@/lib/constants";
import { NavLinks } from "./nav-links";

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="grid size-8 place-items-center rounded-lg bg-primary font-heading text-sm font-semibold text-primary-foreground">
          CB
        </span>
        <span className="font-heading text-lg font-semibold text-sidebar-foreground">
          {APP_NAME}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <NavLinks />
      </div>
    </aside>
  );
}
