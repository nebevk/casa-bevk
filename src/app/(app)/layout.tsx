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

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [user, profile, members, categories] = await Promise.all([
    requireUser(),
    getProfile(),
    getHouseholdMembers(),
    getExpenseCategories(),
  ]);
  const name =
    (profile as { display_name?: string } | null)?.display_name ?? null;

  return (
    <RealtimeProvider>
      <div className="flex min-h-svh">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar email={user.email ?? ""} name={name} />
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
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
  );
}
