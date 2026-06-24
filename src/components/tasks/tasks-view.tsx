"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import type { Member } from "@/lib/auth/dal";
import type { TaskRow } from "@/lib/tasks/queries";
import {
  addTask,
  deleteTask,
  setTaskAssignee,
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
import { cn } from "@/lib/utils";

const initials = (name: string) => name.trim().slice(0, 2).toUpperCase();

const formatDue = (due: string) =>
  new Date(due).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

type Mutate = (fn: () => Promise<void> | void) => void;

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
  const formRef = useRef<HTMLFormElement>(null);

  const memberById = useMemo(
    () => new Map(members.map((m) => [m.id, m] as const)),
    [members],
  );

  const filtered = tasks.filter((t) =>
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
    startTransition(async () => {
      await addTask(formData);
      formRef.current?.reset();
    });
  }

  const mutate: Mutate = (fn) => startTransition(fn);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          To-Do
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Shared tasks — assign them to{" "}
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
            value="none"
            label="Anyone"
            defaultChecked={!currentUserId}
          />
          {members.map((m) => (
            <RadioChip
              key={m.id}
              value={m.id}
              label={m.name}
              defaultChecked={currentUserId === m.id}
            />
          ))}
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
          <p className="rounded-lg border border-dashed border-border bg-card/50 py-10 text-center text-sm text-muted-foreground">
            Nothing to do — add a task above.
          </p>
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
              mutate={mutate}
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
              mutate={mutate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RadioChip({
  value,
  label,
  defaultChecked,
}: {
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name="assignee_id"
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
  mutate,
}: {
  task: TaskRow;
  member: Member | null;
  members: Member[];
  mutate: Mutate;
}) {
  const overdue =
    !task.is_done &&
    !!task.due_at &&
    new Date(task.due_at) < new Date(new Date().toDateString());

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm">
      <button
        type="button"
        onClick={() => mutate(() => toggleTask(task.id, !task.is_done))}
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
            onClick={() => mutate(() => setTaskAssignee(task.id, null))}
          >
            Anyone
          </DropdownMenuItem>
          {members.map((m) => (
            <DropdownMenuItem
              key={m.id}
              onClick={() => mutate(() => setTaskAssignee(task.id, m.id))}
            >
              {m.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        onClick={() => mutate(() => deleteTask(task.id))}
        className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
        aria-label="Delete task"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
