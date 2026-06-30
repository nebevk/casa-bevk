"use client";

import { useState, useTransition } from "react";
import {
  Dumbbell,
  ExternalLink,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  Repeat,
  Timer,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Member } from "@/lib/auth/dal";
import type { SportProfile, Workout } from "@/lib/activity/queries";
import { deleteSportProfile, deleteWorkout } from "@/lib/activity/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CozyEmpty, MugArt } from "@/components/cozy";
import { WorkoutPlayer } from "./workout-player";
import { WorkoutDialog } from "./workout-dialog";
import { SportProfileDialog } from "./sport-profile-dialog";

const STRAVA = "#FC4C02";
const initials = (name: string) => name.trim().slice(0, 2).toUpperCase();

function totalSeconds(w: Workout) {
  return w.steps.reduce((s, x) => s + x.duration_seconds, 0) * w.rounds;
}
function fmtTotal(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m${sec ? ` ${sec}s` : ""}` : `${sec}s`;
}

type ProfileTarget = {
  memberId: string;
  memberName: string;
  profile: SportProfile | null;
};

export function ActivityView({
  workouts,
  profiles,
  members,
}: {
  workouts: Workout[];
  profiles: SportProfile[];
  members: Member[];
  currentUserId: string | null;
}) {
  const [playing, setPlaying] = useState<Workout | null>(null);
  const [editWorkout, setEditWorkout] = useState<Workout | "new" | null>(null);
  const [profileTarget, setProfileTarget] = useState<ProfileTarget | null>(null);
  const [, startTransition] = useTransition();

  function removeWorkout(id: string) {
    startTransition(async () => {
      try {
        await deleteWorkout(id);
      } catch {
        toast.error("Couldn't delete the workout.");
      }
    });
  }
  function removeProfile(id: string) {
    startTransition(async () => {
      try {
        await deleteSportProfile(id);
      } catch {
        toast.error("Couldn't remove the profile.");
      }
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Activity
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Move together. Play a workout or check in on Strava.
        </p>
      </div>

      {/* Strava */}
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-medium">Strava</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {members.map((m) => {
            const profile =
              profiles.find((p) => p.member_id === m.id) ?? null;
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
              >
                <Avatar className="size-10">
                  <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
                    {initials(m.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {profile ? (profile.label ?? "Strava profile") : "Not linked"}
                  </p>
                </div>
                {profile ? (
                  <div className="flex items-center gap-1">
                    <a
                      href={profile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-white"
                      style={{ backgroundColor: STRAVA }}
                    >
                      Open
                      <ExternalLink className="size-3.5" />
                    </a>
                    <button
                      type="button"
                      aria-label="Edit Strava link"
                      onClick={() =>
                        setProfileTarget({
                          memberId: m.id,
                          memberName: m.name,
                          profile,
                        })
                      }
                      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove Strava link"
                      onClick={() => removeProfile(profile.id)}
                      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setProfileTarget({
                        memberId: m.id,
                        memberName: m.name,
                        profile: null,
                      })
                    }
                  >
                    <Plus />
                    Link
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Workouts */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-medium">Workouts</h2>
          <Button size="sm" onClick={() => setEditWorkout("new")}>
            <Plus />
            New workout
          </Button>
        </div>

        {workouts.length === 0 ? (
          <CozyEmpty art={<MugArt />} className="py-10">
            No workouts yet. Build a timed circuit and press play.
          </CozyEmpty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workouts.map((w) => {
              const moves = w.steps.filter((s) => !s.is_rest).length;
              return (
                <div
                  key={w.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{w.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Dumbbell className="size-3.5" />
                          {moves} {moves === 1 ? "move" : "moves"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Timer className="size-3.5" />
                          {fmtTotal(totalSeconds(w))}
                        </span>
                        {w.rounds > 1 && (
                          <span className="inline-flex items-center gap-1">
                            <Repeat className="size-3.5" />
                            {w.rounds}x
                          </span>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="Workout menu"
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <MoreVertical className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => setEditWorkout(w)}>
                          <Pencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => removeWorkout(w.id)}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <Button
                    className="mt-auto w-full"
                    onClick={() => setPlaying(w)}
                    disabled={w.steps.length === 0}
                  >
                    <Play className="fill-current" />
                    Play
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {playing && (
        <WorkoutPlayer workout={playing} onClose={() => setPlaying(null)} />
      )}
      {editWorkout && (
        <WorkoutDialog
          workout={editWorkout === "new" ? undefined : editWorkout}
          open
          onOpenChange={(o) => !o && setEditWorkout(null)}
        />
      )}
      {profileTarget && (
        <SportProfileDialog
          profile={profileTarget.profile}
          memberId={profileTarget.memberId}
          memberName={profileTarget.memberName}
          open
          onOpenChange={(o) => !o && setProfileTarget(null)}
        />
      )}
    </div>
  );
}
