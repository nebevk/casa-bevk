import type { ReactNode } from "react";
import { getProfile, requireUser } from "@/lib/auth/dal";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { TopBar } from "@/components/app-shell/top-bar";
import { RealtimeProvider } from "@/components/providers/realtime-provider";
import { QuickAddNote } from "@/components/notes/quick-add-note";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const profile = await getProfile();
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
      <QuickAddNote />
    </RealtimeProvider>
  );
}
