"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Household-scoped tables that should sync live between the two members. */
const REALTIME_TABLES = [
  "tasks",
  "shopping_items",
  "notes",
  "calendar_events",
  "expenses",
  "recurring_payments",
  "maintenance_log",
  "assets",
  "providers",
];

/**
 * Subscribes to Postgres changes on household tables and refreshes the route
 * (debounced) so both partners' devices stay in sync. RLS filters which change
 * events each user receives. No-op until Supabase is configured.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const supabase = createClient();
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 350);
    };

    const channel = supabase.channel("casa-bevk-sync");
    for (const table of REALTIME_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        refresh,
      );
    }
    channel.subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return <>{children}</>;
}
