import type { Metadata } from "next";
import { getHouseholdMembers, getUser } from "@/lib/auth/dal";
import { getSportProfiles, getWorkouts } from "@/lib/activity/queries";
import { ActivityView } from "@/components/activity/activity-view";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage() {
  const [workouts, profiles, members, user] = await Promise.all([
    getWorkouts(),
    getSportProfiles(),
    getHouseholdMembers(),
    getUser(),
  ]);

  return (
    <ActivityView
      workouts={workouts}
      profiles={profiles}
      members={members}
      currentUserId={user?.id ?? null}
    />
  );
}
