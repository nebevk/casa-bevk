"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { CalendarEvent } from "@/lib/calendar/recurrence";
import { addEvent, deleteEvent, updateEvent } from "@/lib/calendar/actions";
import { todayDateInput } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const FREQ = ["none", "daily", "weekly", "monthly", "yearly"] as const;

const pad = (n: number) => String(n).padStart(2, "0");
const toDateInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const toTimeInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function EventDialog({
  trigger,
  event,
  defaultDate,
  open,
  onOpenChange,
}: {
  trigger?: ReactNode;
  event?: CalendarEvent;
  defaultDate?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const t = useT();
  const isEdit = Boolean(event?.id);
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [allDay, setAllDay] = useState(event?.all_day ?? false);
  const [freq, setFreq] = useState<string>(event?.recurrence_freq ?? "none");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const date = String(formData.get("date") ?? "");
    if (!date) return;
    const startTime = String(formData.get("start_time") ?? "") || "09:00";
    const endTime = String(formData.get("end_time") ?? "");

    const starts_at = allDay
      ? new Date(`${date}T00:00`).toISOString()
      : new Date(`${date}T${startTime}`).toISOString();
    let ends_at = "";
    if (!allDay && endTime) {
      const e = new Date(`${date}T${endTime}`);
      if (e.getTime() > new Date(starts_at).getTime()) ends_at = e.toISOString();
    }
    const untilDate = String(formData.get("until") ?? "");
    const recurrence_until =
      freq !== "none" && untilDate
        ? new Date(`${untilDate}T23:59`).toISOString()
        : "";

    formData.set("starts_at", starts_at);
    formData.set("ends_at", ends_at);
    formData.set("all_day", allDay ? "true" : "false");
    formData.set("recurrence_freq", freq);
    formData.set("recurrence_until", recurrence_until);

    setOpen(false);
    if (!isEdit) {
      setAllDay(false);
      setFreq("none");
    }
    startTransition(async () => {
      try {
        if (isEdit && event) await updateEvent(event.id, formData);
        else await addEvent(formData);
      } catch {
        toast.error(t("calendar.saveError"));
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isEdit ? t("calendar.editEvent") : t("calendar.newEvent")}
          </DialogTitle>
          <DialogDescription>{t("calendar.dialogDesc")}</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          <Field
            name="title"
            label={t("calendar.fields.title")}
            required
            placeholder={t("calendar.titlePlaceholder")}
            defaultValue={event?.title ?? ""}
          />

          <div className="grid grid-cols-2 gap-3">
            <Field
              name="date"
              label={t("calendar.fields.date")}
              type="date"
              required
              defaultValue={
                event
                  ? toDateInput(event.starts_at)
                  : (defaultDate ?? todayDateInput())
              }
            />
            <div className="flex items-end">
              <Chip active={allDay} onClick={() => setAllDay((v) => !v)}>
                {t("calendar.allDay")}
              </Chip>
            </div>
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <Field
                name="start_time"
                label={t("calendar.fields.start")}
                type="time"
                defaultValue={event ? toTimeInput(event.starts_at) : "09:00"}
              />
              <Field
                name="end_time"
                label={t("calendar.fields.end")}
                type="time"
                defaultValue={event?.ends_at ? toTimeInput(event.ends_at) : ""}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t("calendar.repeats")}
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {FREQ.map((value) => (
                <Chip key={value} active={freq === value} onClick={() => setFreq(value)}>
                  {t(`calendar.freq.${value}`)}
                </Chip>
              ))}
            </div>
          </div>

          {freq !== "none" && (
            <Field
              name="until"
              label={t("calendar.fields.until")}
              type="date"
              defaultValue={
                event?.recurrence_until ? toDateInput(event.recurrence_until) : ""
              }
            />
          )}

          <Field
            name="location"
            label={t("calendar.fields.location")}
            defaultValue={event?.location ?? ""}
          />

          <DialogFooter className="gap-2 sm:justify-between">
            {isEdit && event ? (
              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={() => {
                  setOpen(false);
                  startTransition(async () => {
                    try {
                      await deleteEvent(event.id);
                    } catch {
                      toast.error(t("calendar.deleteError"));
                    }
                  });
                }}
              >
                {t("calendar.delete")}
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isEdit ? t("calendar.save") : t("calendar.addEvent")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`ev-${name}`} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={`ev-${name}`}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        autoComplete="off"
      />
    </div>
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
        "rounded-full border px-2.5 py-1 text-xs transition-colors",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
