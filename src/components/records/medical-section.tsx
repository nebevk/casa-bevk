"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Pencil,
  Plus,
  Repeat,
  Stethoscope,
  Syringe,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { Member } from "@/lib/auth/dal";
import type {
  HealthReminderRow,
  MedicalContactRow,
} from "@/lib/medical/queries";
import {
  completeHealthReminder,
  deleteHealthReminder,
  deleteMedicalContact,
} from "@/lib/medical/actions";
import { daysUntil, formatDate } from "@/lib/format";
import { MedicalContactDialog } from "./medical-contact-dialog";
import { HealthReminderDialog } from "./health-reminder-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = {
  gp: "GP",
  dentist: "Dentist",
  pediatrician: "Pediatrician",
  gynecologist: "Gynecologist",
  specialist: "Specialist",
  other: "Other",
  checkup: "Checkup",
  vaccination: "Vaccination",
  screening: "Screening",
};

export function MedicalSection({
  contacts,
  reminders,
  members,
  currentUserId,
}: {
  contacts: MedicalContactRow[];
  reminders: HealthReminderRow[];
  members: Member[];
  currentUserId: string | null;
}) {
  const [editContact, setEditContact] = useState<MedicalContactRow | null>(null);
  const [editReminder, setEditReminder] = useState<HealthReminderRow | null>(
    null,
  );
  const [, startTransition] = useTransition();

  const memberName = useMemo(
    () => new Map(members.map((m) => [m.id, m.name] as const)),
    [members],
  );
  const forWhom = (id: string | null) =>
    id ? (memberName.get(id) ?? "—") : "Both";

  function mutate(fn: () => Promise<void>) {
    startTransition(async () => {
      try {
        await fn();
      } catch {
        toast.error("Couldn't update — please try again.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <a
        href="https://dozdravnika.si"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-accent/40 p-4 transition-colors hover:border-primary/50"
      >
        <span className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Stethoscope className="size-5" />
          </span>
          <span>
            <span className="block font-medium">Do zdravnika</span>
            <span className="block text-xs text-muted-foreground">
              Book appointments at dozdravnika.si
            </span>
          </span>
        </span>
        <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
      </a>

      {/* Doctors & dentists */}
      <Section
        title="Doctors & dentists"
        action={
          <MedicalContactDialog
            members={members}
            trigger={
              <Button variant="outline" size="sm">
                <Plus />
                Add
              </Button>
            }
          />
        }
      >
        {contacts.length === 0 ? (
          <Empty icon={Stethoscope} text="Add your doctors and dentists." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="group flex flex-col rounded-lg border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {KIND_LABEL[c.kind] ?? c.kind} · {forWhom(c.member_id)}
                      {c.clinic ? ` · ${c.clinic}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditContact(c)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Edit"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => mutate(() => deleteMedicalContact(c.id))}
                      className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                {(c.phone || c.email) && (
                  <p className="mt-2 truncate text-sm text-muted-foreground">
                    {[c.phone, c.email].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Health reminders */}
      <Section
        title="Reminders"
        action={
          <HealthReminderDialog
            members={members}
            currentUserId={currentUserId}
            trigger={
              <Button variant="outline" size="sm">
                <Plus />
                Add
              </Button>
            }
          />
        }
      >
        {reminders.length === 0 ? (
          <Empty
            icon={Syringe}
            text="Add checkup & vaccination reminders."
          />
        ) : (
          <ul className="space-y-2">
            {reminders.map((r) => {
              const days = daysUntil(r.due_on);
              const overdue = days != null && days < 0;
              const soon = days != null && days >= 0 && days <= 30;
              return (
                <li
                  key={r.id}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() =>
                      mutate(() =>
                        completeHealthReminder(r.id, r.due_on, r.interval_months),
                      )
                    }
                    className="text-muted-foreground transition-colors hover:text-primary"
                    aria-label="Mark done"
                  >
                    <CheckCircle2 className="size-5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {KIND_LABEL[r.kind] ?? r.kind} · {forWhom(r.member_id)}
                      {r.interval_months ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Repeat className="size-3" />
                          {r.interval_months}m
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-xs tabular-nums",
                      overdue
                        ? "text-destructive"
                        : soon
                          ? "text-primary"
                          : "text-muted-foreground",
                    )}
                  >
                    {formatDate(r.due_on)}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditReminder(r)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Edit"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => mutate(() => deleteHealthReminder(r.id))}
                      className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {editContact && (
        <MedicalContactDialog
          contact={editContact}
          members={members}
          open
          onOpenChange={(o) => {
            if (!o) setEditContact(null);
          }}
        />
      )}
      {editReminder && (
        <HealthReminderDialog
          reminder={editReminder}
          members={members}
          currentUserId={currentUserId}
          open
          onOpenChange={(o) => {
            if (!o) setEditReminder(null);
          }}
        />
      )}
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-medium">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/50 py-10 text-center">
      <Icon className="mx-auto size-7 text-muted-foreground/60" />
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
