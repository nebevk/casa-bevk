"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Workout } from "@/lib/activity/queries";
import { createWorkout, updateWorkout } from "@/lib/activity/actions";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type StepDraft = {
  key: string;
  name: string;
  duration: number;
  is_rest: boolean;
};

const uid = () => crypto.randomUUID();

function initialSteps(workout?: Workout): StepDraft[] {
  if (workout && workout.steps.length > 0) {
    return workout.steps.map((s) => ({
      key: uid(),
      name: s.name,
      duration: s.duration_seconds,
      is_rest: s.is_rest,
    }));
  }
  return [{ key: uid(), name: "", duration: 40, is_rest: false }];
}

export function WorkoutDialog({
  workout,
  open,
  onOpenChange,
}: {
  workout?: Workout;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState(workout?.name ?? "");
  const [rounds, setRounds] = useState(workout?.rounds ?? 1);
  const [steps, setSteps] = useState<StepDraft[]>(() => initialSteps(workout));
  const [isPending, startTransition] = useTransition();

  const isEdit = Boolean(workout);

  function patch(key: string, next: Partial<StepDraft>) {
    setSteps((prev) =>
      prev.map((s) => (s.key === key ? { ...s, ...next } : s)),
    );
  }
  function move(key: string, dir: -1 | 1) {
    setSteps((prev) => {
      const i = prev.findIndex((s) => s.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }
  function remove(key: string) {
    setSteps((prev) => prev.filter((s) => s.key !== key));
  }
  function addStep(is_rest: boolean) {
    setSteps((prev) => [
      ...prev,
      {
        key: uid(),
        name: is_rest ? "Rest" : "",
        duration: is_rest ? 20 : 40,
        is_rest,
      },
    ]);
  }

  const cleaned = steps
    .map((s) => ({
      name: s.name.trim(),
      duration_seconds: Math.min(3600, Math.max(1, Math.round(s.duration) || 1)),
      is_rest: s.is_rest,
    }))
    .filter((s) => s.name.length > 0);

  const totalSeconds =
    cleaned.reduce((sum, s) => sum + s.duration_seconds, 0) * Math.max(1, rounds);

  function submit() {
    if (!name.trim()) return;
    const fd = new FormData();
    if (workout) fd.set("id", workout.id);
    fd.set("name", name.trim());
    fd.set("rounds", String(Math.min(20, Math.max(1, rounds))));
    fd.set("steps", JSON.stringify(cleaned));
    startTransition(async () => {
      try {
        if (workout) await updateWorkout(fd);
        else await createWorkout(fd);
        onOpenChange(false);
      } catch {
        toast.error("Couldn't save the workout, please try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit workout" : "New workout"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="wk-name">Name</Label>
              <Input
                id="wk-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Morning HIIT"
                autoComplete="off"
              />
            </div>
            <div className="w-20 space-y-1.5">
              <Label htmlFor="wk-rounds">Rounds</Label>
              <Input
                id="wk-rounds"
                type="number"
                min={1}
                max={20}
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Moves</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {cleaned.length} moves · {Math.floor(totalSeconds / 60)}m{" "}
                {totalSeconds % 60}s total
              </span>
            </div>

            <ul className="space-y-2">
              {steps.map((s, i) => (
                <li
                  key={s.key}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border border-border p-2",
                    s.is_rest ? "bg-muted/40" : "bg-card",
                  )}
                >
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => move(s.key, -1)}
                      disabled={i === 0}
                      aria-label="Move up"
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(s.key, 1)}
                      disabled={i === steps.length - 1}
                      aria-label="Move down"
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                  </div>
                  <Input
                    value={s.name}
                    onChange={(e) => patch(s.key, { name: e.target.value })}
                    placeholder={s.is_rest ? "Rest" : "Exercise"}
                    autoComplete="off"
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      max={3600}
                      value={s.duration}
                      onChange={(e) =>
                        patch(s.key, { duration: Number(e.target.value) || 1 })
                      }
                      aria-label="Seconds"
                      className="w-16"
                    />
                    <span className="text-xs text-muted-foreground">s</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => patch(s.key, { is_rest: !s.is_rest })}
                    className={cn(
                      "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                      s.is_rest
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {s.is_rest ? "Rest" : "Move"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(s.key)}
                    aria-label="Remove move"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addStep(false)}
              >
                <Plus />
                Move
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addStep(true)}
              >
                <Plus />
                Rest
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter showCloseButton>
          <Button
            type="button"
            onClick={submit}
            disabled={isPending || !name.trim()}
          >
            {isPending && <Loader2 className="animate-spin" />}
            {isEdit ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
