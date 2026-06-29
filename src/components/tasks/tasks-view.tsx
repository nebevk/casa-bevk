"use client";

import { useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import {
  Archive,
  ArchiveRestore,
  CalendarClock,
  Loader2,
  Lock,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Member } from "@/lib/auth/dal";
import type { TaskRow } from "@/lib/tasks/queries";
import {
  addTask,
  archiveDoneTasks,
  archiveTask,
  clearArchivedTasks,
  deleteTask,
  setTaskAssignee,
  setTaskStatus,
  setTaskVisibility,
  unarchiveTask,
} from "@/lib/tasks/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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

type Status = "todo" | "in_progress" | "done";
const COLUMNS: { key: Status; label: string }[] = [
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
];

type OptimisticAction =
  | { kind: "delete"; id: string }
  | { kind: "assign"; id: string; assignee_id: string | null }
  | { kind: "visibility"; id: string; visibility: string }
  | { kind: "status"; id: string; status: Status }
  | { kind: "archive"; id: string }
  | { kind: "unarchive"; id: string }
  | { kind: "archiveDone" }
  | { kind: "clearArchived" }
  | { kind: "add"; task: TaskRow };

function applyOptimistic(state: TaskRow[], action: OptimisticAction): TaskRow[] {
  switch (action.kind) {
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
    case "status":
      return state.map((t) =>
        t.id === action.id
          ? { ...t, status: action.status, is_done: action.status === "done" }
          : t,
      );
    case "archive":
      return state.map((t) =>
        t.id === action.id ? { ...t, archived: true } : t,
      );
    case "unarchive":
      return state.map((t) =>
        t.id === action.id ? { ...t, archived: false } : t,
      );
    case "archiveDone":
      return state.map((t) =>
        t.status === "done" && !t.archived ? { ...t, archived: true } : t,
      );
    case "clearArchived":
      return state.filter((t) => !t.archived);
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
  const [showArchived, setShowArchived] = useState(false);
  const [dragOver, setDragOver] = useState<Status | null>(null);
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

  function moveTo(task: TaskRow, status: Status) {
    if ((task.status as Status) === status) return;
    run({ kind: "status", id: task.id, status }, () =>
      setTaskStatus(task.id, status),
    );
  }

  function handleClearArchived(count: number) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Clear all ${count} archived ${count === 1 ? "task" : "tasks"}? This removes them from the list.`,
      )
    )
      return;
    run({ kind: "clearArchived" }, () => clearArchivedTasks());
  }

  const filtered = optimisticTasks.filter((t) =>
    filter === "all"
      ? true
      : filter === "unassigned"
        ? !t.assignee_id
        : t.assignee_id === filter,
  );
  const boardTasks = filtered.filter((t) => !t.archived);
  const archivedTasks = filtered.filter((t) => t.archived);

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
          status: "todo",
          archived: false,
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
          Tap a card&rsquo;s menu to move it between columns (or drag on a
          computer).
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
          <Input name="due" type="date" aria-label="Due date" className="sm:w-40" />
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

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const colTasks = boardTasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(col.key);
              }}
              onDragLeave={() =>
                setDragOver((c) => (c === col.key ? null : c))
              }
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                const task = optimisticTasks.find((t) => t.id === id);
                if (task) moveTo(task, col.key);
                setDragOver(null);
              }}
              className={cn(
                "flex flex-col rounded-xl border border-border bg-muted/30 p-2 transition-colors",
                dragOver === col.key && "border-primary/40 bg-primary/5 ring-1 ring-primary/30",
              )}
            >
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-sm font-medium">{col.label}</span>
                <div className="flex items-center gap-1.5">
                  {col.key === "done" && colTasks.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        run({ kind: "archiveDone" }, () => archiveDoneTasks())
                      }
                      className="-m-1 inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                      aria-label="Archive all done"
                      title="Archive all done"
                    >
                      <Archive className="size-3.5" />
                    </button>
                  )}
                  <span className="rounded-full bg-background px-1.5 text-xs text-muted-foreground tabular-nums">
                    {colTasks.length}
                  </span>
                </div>
              </div>
              <div className="min-h-16 space-y-2">
                {colTasks.length === 0 ? (
                  col.key === "todo" ? (
                    <CozyEmpty art={<PlantArt />} className="py-8">
                      All caught up.
                    </CozyEmpty>
                  ) : (
                    <p className="rounded-lg border border-dashed border-border/70 py-6 text-center text-xs text-muted-foreground/70">
                      Nothing here yet
                    </p>
                  )
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      member={
                        task.assignee_id
                          ? (memberById.get(task.assignee_id) ?? null)
                          : null
                      }
                      members={members}
                      currentUserId={currentUserId}
                      run={run}
                      moveTo={moveTo}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {archivedTasks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Archive className="size-4" />
              {showArchived ? "Hide" : "Show"} archived ({archivedTasks.length})
            </button>
            {showArchived && (
              <button
                type="button"
                onClick={() => handleClearArchived(archivedTasks.length)}
                className="text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                Clear all
              </button>
            )}
          </div>
          {showArchived && (
            <ul className="space-y-2">
              {archivedTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card/50 px-3 py-2 text-sm"
                >
                  <span className="flex-1 truncate text-muted-foreground line-through">
                    {task.title}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      run({ kind: "unarchive", id: task.id }, () =>
                        unarchiveTask(task.id),
                      )
                    }
                    className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Restore"
                    title="Restore"
                  >
                    <ArchiveRestore className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      run({ kind: "delete", id: task.id }, () =>
                        deleteTask(task.id),
                      )
                    }
                    className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Delete"
                    title="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {showArchived && (
            <p className="text-xs text-muted-foreground/80">
              Tasks done over 30 days ago are archived automatically.
            </p>
          )}
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

function TaskCard({
  task,
  member,
  members,
  currentUserId,
  run,
  moveTo,
}: {
  task: TaskRow;
  member: Member | null;
  members: Member[];
  currentUserId: string | null;
  run: (action: OptimisticAction, mutate: () => Promise<void>) => void;
  moveTo: (task: TaskRow, status: Status) => void;
}) {
  const isDone = task.status === "done";
  const isPersonal = task.visibility === "personal";
  const canPrivatize = task.owner_id != null && task.owner_id === currentUserId;
  const overdue =
    !isDone &&
    !!task.due_at &&
    new Date(task.due_at) < new Date(new Date().toDateString());

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
      className="group cursor-grab rounded-lg border border-border bg-card p-2.5 shadow-sm transition-colors hover:border-primary/40 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-1.5">
        <p
          className={cn(
            "text-sm",
            isDone && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Task menu"
              className="reveal-hover -m-2 inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Move to</DropdownMenuLabel>
            {COLUMNS.map((c) => (
              <DropdownMenuItem
                key={c.key}
                disabled={task.status === c.key}
                onClick={() => moveTo(task, c.key)}
              >
                {c.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Assign to</DropdownMenuLabel>
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
            {canPrivatize && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    run(
                      {
                        kind: "visibility",
                        id: task.id,
                        visibility: isPersonal ? "shared" : "personal",
                      },
                      () =>
                        setTaskVisibility(
                          task.id,
                          isPersonal ? "shared" : "personal",
                        ),
                    )
                  }
                >
                  {isPersonal ? "Make shared" : "Make personal"}
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                run({ kind: "archive", id: task.id }, () => archiveTask(task.id))
              }
            >
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                run({ kind: "delete", id: task.id }, () => deleteTask(task.id))
              }
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2 flex items-center gap-2">
        {task.due_at && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs",
              overdue ? "text-destructive" : "text-muted-foreground",
            )}
          >
            <CalendarClock className="size-3.5" />
            {formatDue(task.due_at)}
          </span>
        )}
        {isPersonal && (
          <span
            className="inline-flex items-center gap-1 text-xs text-primary"
            title="Personal: only you can see this"
          >
            <Lock className="size-3" />
            Personal
          </span>
        )}
        <span className="flex-1" />
        {member && (
          <Avatar className="size-6">
            <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">
              {initials(member.name)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
