"use client";

import { useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Loader2,
  Lock,
  LockOpen,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Member } from "@/lib/auth/dal";
import type { TaskRow } from "@/lib/tasks/queries";
import {
  addTask,
  deleteTask,
  setTaskAssignee,
  setTaskVisibility,
  toggleTask,
} from "@/lib/tasks/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CozyEmpty, PlantArt } from "@/components/cozy";
import { cn } from "@/lib/utils";

const initials = (name: string) => name.trim().slice(0, 2).toUpperCase();

const formatDue = (due: string) =>
  new Date(due).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

type OptimisticAction =
  | { kind: "toggle"; id: string }
  | { kind: "delete"; id: string }
  | { kind: "assign"; id: string; assignee_id: string | null }
  | { kind: "visibility"; id: string; visibility: string }
  | { kind: "add"; task: TaskRow };

function applyOptimistic(state: TaskRow[], action: OptimisticAction): TaskRow[] {
  switch (action.kind) {
    case "toggle":
      return state.map((t) =>
        t.id === action.id ? { ...t, is_done: !t.is_done } : t,
      );
    case "delete":
      return state.filter((t) => t.id !== action.id);
    case "assign":
      return state.map((t) =>
        t.id === action.id ? { ...t, assignee_id: action.assignee_id } : t,
      );
    case "visibility":
      return state.map((t) =>
        t.id === action.id ? { ...t, visibility: action.visibility } : t,
      );
    case "add":
      return [...state, action.task];
  }
}

export function TasksView({
  tasks,
  members,
  currentUserId,
}: {
  tasks: TaskRow[];
  members: Member[];
  currentUserId: string | null;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [optimisticTasks, optimize] = useOptimistic(tasks, applyOptimistic);
  const formRef = useRef<HTMLFormElement>(null);

  const memberById = useMemo(
    () => new Map(members.map((m) => [m.id, m] as const)),
    [members],
  );

  // Optimistic update first (instant), then sync to the server in the background.
  function run(action: OptimisticAction, mutate: () => Promise<void>) {
    startTransition(async () => {
      optimize(action);
      try {
        await mutate();
      } catch {
        toast.error("Couldn't save, please try again.");
      }
    });
  }

  const filtered = optimisticTasks.filter((t) =>
    filter === "all"
      ? true
      : filter === "unassigned"
        ? !t.assignee_id
        : t.assignee_id === filter,
  );
  const open = filtered.filter((t) => !t.is_done);
  const done = filtered.filter((t) => t.is_done);

  const filterChips = [
    { key: "all", label: "All" },
    ...members.map((m) => ({ key: m.id, label: m.name })),
    { key: "unassigned", label: "Anyone" },
  ];

  function handleAdd(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    if (!title) return;
    const assigneeRaw = String(formData.get("assignee_id") ?? "");
    const assignee_id =
      assigneeRaw && assigneeRaw !== "none" ? assigneeRaw : null;
    const dueRaw = String(formData.get("due") ?? "").trim();
    const due_at = dueRaw ? new Date(dueRaw).toISOString() : null;
    const visibility =
      formData.get("visibility") === "personal" ? "personal" : "shared";
    formRef.current?.reset();
    run(
      {
        kind: "add",
        task: {
          id: `temp-${crypto.randomUUID()}`,
          title,
          due_at,
          is_done: false,
          assignee_id,
          visibility,
          owner_id: currentUserId,
        },
      },
      () => addTask(formData),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          To-Do
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Shared tasks. Assign them to{" "}
          {members.map((m) => m.name).join(" or ") || "anyone"}.
        </p>
      </div>

      <form
        ref={formRef}
        action={handleAdd}
        className="rounded-lg border border-border bg-card p-3 shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            name="title"
            placeholder="Add a task…"
            required
            autoComplete="off"
            className="flex-1"
          />
          <Input
            name="due"
            type="date"
            aria-label="Due date"
            className="sm:w-40"
          />
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
            Add
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Assign to</span>
          <RadioChip
            name="assignee_id"
            value="none"
            label="Anyone"
            defaultChecked={!currentUserId}
          />
          {members.map((m) => (
            <RadioChip
              key={m.id}
              name="assignee_id"
              value={m.id}
              label={m.name}
              defaultChecked={currentUserId === m.id}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Visibility</span>
          <RadioChip name="visibility" value="shared" label="Shared" defaultChecked />
          <RadioChip name="visibility" value="personal" label="Personal" />
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        {filterChips.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              filter === f.key
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {open.length === 0 ? (
          <CozyEmpty art={<PlantArt />}>
            All caught up. A little space to grow into.
          </CozyEmpty>
        ) : (
          open.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              member={
                task.assignee_id
                  ? (memberById.get(task.assignee_id) ?? null)
                  : null
              }
              members={members}
              run={run}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>

      {done.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Done ({done.length})
          </h2>
          {done.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              member={
                task.assignee_id
                  ? (memberById.get(task.assignee_id) ?? null)
                  : null
              }
              members={members}
              run={run}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RadioChip({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-foreground">
        {label}
      </span>
    </label>
  );
}

function TaskItem({
  task,
  member,
  members,
  run,
  currentUserId,
}: {
  task: TaskRow;
  member: Member | null;
  members: Member[];
  run: (action: OptimisticAction, mutate: () => Promise<void>) => void;
  currentUserId: string | null;
}) {
  const overdue =
    !task.is_done &&
    !!task.due_at &&
    new Date(task.due_at) < new Date(new Date().toDateString());
  const isPersonal = task.visibility === "personal";
  // Only the owner may flip visibility (RLS + guard enforce it server-side too).
  const canPrivatize = task.owner_id != null && task.owner_id === currentUserId;

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm">
      <button
        type="button"
        onClick={() =>
          run({ kind: "toggle", id: task.id }, () =>
            toggleTask(task.id, !task.is_done),
          )
        }
        className="text-muted-foreground transition-colors hover:text-primary"
        aria-label={task.is_done ? "Mark not done" : "Mark done"}
      >
        {task.is_done ? (
          <CheckCircle2 className="size-5 text-primary" />
        ) : (
          <Circle className="size-5" />
        )}
      </button>

      <span
        className={cn(
          "flex-1 text-sm",
          task.is_done && "text-muted-foreground line-through",
        )}
      >
        {task.title}
      </span>

      {canPrivatize && (
        <button
          type="button"
          onClick={() =>
            run(
              {
                kind: "visibility",
                id: task.id,
                visibility: isPersonal ? "shared" : "personal",
              },
              () =>
                setTaskVisibility(task.id, isPersonal ? "shared" : "personal"),
            )
          }
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
            isPersonal
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground hover:bg-muted/70",
          )}
          title={
            isPersonal
              ? "Personal: only you can see this. Click to share."
              : "Shared. Click to make personal."
          }
        >
          {isPersonal ? <Lock className="size-3" /> : <LockOpen className="size-3" />}
          {isPersonal ? "Personal" : "Shared"}
        </button>
      )}

      {task.due_at && (
        <span
          className={cn(
            "hidden items-center gap-1 text-xs sm:inline-flex",
            overdue ? "text-destructive" : "text-muted-foreground",
          )}
        >
          <CalendarClock className="size-3.5" />
          {formatDue(task.due_at)}
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label="Assign task" className="shrink-0">
            {member ? (
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">
                  {initials(member.name)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <span className="grid size-7 place-items-center rounded-full border border-dashed border-border text-muted-foreground">
                <Plus className="size-3.5" />
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              run({ kind: "assign", id: task.id, assignee_id: null }, () =>
                setTaskAssignee(task.id, null),
              )
            }
          >
            Anyone
          </DropdownMenuItem>
          {members.map((m) => (
            <DropdownMenuItem
              key={m.id}
              onClick={() =>
                run({ kind: "assign", id: task.id, assignee_id: m.id }, () =>
                  setTaskAssignee(task.id, m.id),
                )
              }
            >
              {m.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        onClick={() =>
          run({ kind: "delete", id: task.id }, () => deleteTask(task.id))
        }
        className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
        aria-label="Delete task"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
