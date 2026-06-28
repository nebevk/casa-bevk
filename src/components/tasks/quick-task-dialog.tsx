"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Member } from "@/lib/auth/dal";
import { addTask } from "@/lib/tasks/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function QuickTaskDialog({
  members,
  currentUserId,
  open,
  onOpenChange,
}: {
  members: Member[];
  currentUserId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [assignee, setAssignee] = useState(currentUserId ?? "none");
  const [visibility, setVisibility] = useState<"shared" | "personal">("shared");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("assignee_id", assignee);
    formData.set("visibility", visibility);
    onOpenChange(false);
    setAssignee(currentUserId ?? "none");
    setVisibility("shared");
    startTransition(async () => {
      try {
        await addTask(formData);
      } catch {
        toast.error("Couldn't add task, please try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">New task</DialogTitle>
          <DialogDescription>
            A to-do, shared with the household or just for you.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="qt-title">Task</Label>
            <Input
              id="qt-title"
              name="title"
              placeholder="What needs doing?"
              required
              autoFocus
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Assign to</Label>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={assignee === "none"} onClick={() => setAssignee("none")}>
                Anyone
              </Chip>
              {members.map((m) => (
                <Chip
                  key={m.id}
                  active={assignee === m.id}
                  onClick={() => setAssignee(m.id)}
                >
                  {m.name}
                </Chip>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Visibility</Label>
            <div className="flex flex-wrap gap-1.5">
              <Chip
                active={visibility === "shared"}
                onClick={() => setVisibility("shared")}
              >
                Shared
              </Chip>
              <Chip
                active={visibility === "personal"}
                onClick={() => setVisibility("personal")}
              >
                Personal
              </Chip>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Loader2 className="animate-spin" />}
              Add task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-sm transition-colors",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
