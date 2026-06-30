import type { ReactNode } from "react";
import {
  getHouseholdMembers,
  getProfile,
  requireUser,
} from "@/lib/auth/dal";
import { getExpenseCategories } from "@/lib/expenses/queries";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { TopBar } from "@/components/app-shell/top-bar";
import { RealtimeProvider } from "@/components/providers/realtime-provider";
import { QuickAdd } from "@/components/quick-add";
import { I18nProvider } from "@/lib/i18n/provider";
import { getMessages } from "@/lib/i18n/server";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [user, profile, members, categories, i18n] = await Promise.all([
    requireUser(),
    getProfile(),
    getHouseholdMembers(),
    getExpenseCategories(),
    getMessages(),
  ]);
  const name =
    (profile as { display_name?: string } | null)?.display_name ?? null;

  return (
    <I18nProvider locale={i18n.locale} messages={i18n.messages}>
      <RealtimeProvider>
        <div className="flex min-h-svh">
        <AppSidebar email={user.email ?? ""} name={name} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar email={user.email ?? ""} name={name} />
          <main className="flex-1 px-4 pt-6 pb-[calc(5rem+env(safe-area-inset-bottom))] md:px-8 md:py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
      <QuickAdd
        members={members}
        categories={categories.map((c) => c.name)}
        currentUserId={user.id}
      />
      </RealtimeProvider>
    </I18nProvider>
  );
}
