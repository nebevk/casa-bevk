import { LogoImage } from "@/components/brand-mark";
import { NavLinks } from "./nav-links";

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex flex-col items-center gap-2 bg-[#41553c] px-5 py-6">
        <LogoImage size={76} />
        <div className="font-brand leading-[0.85] text-[#efe9d2]">
          <div className="text-[2rem]">Casa</div>
          <div className="pl-8 text-[2rem]">Bevk</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-4">
        <NavLinks />
      </div>
    </aside>
  );
}
