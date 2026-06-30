"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import {
  Box,
  Building2,
  Car,
  CalendarClock,
  Flame,
  Home,
  Pencil,
  Plus,
  Recycle,
  Shield,
  Smartphone,
  Stethoscope,
  Trash2,
  Tv,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import type {
  AssetRow,
  MaintenanceRow,
  ProviderRow,
} from "@/lib/records/queries";
import { deleteAsset, deleteProvider } from "@/lib/records/actions";
import type { Member } from "@/lib/auth/dal";
import type {
  HealthReminderRow,
  MedicalContactRow,
} from "@/lib/medical/queries";
import { daysUntil, formatDate, formatMoney } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import { AssetDialog } from "./asset-dialog";
import { ProviderDialog } from "./provider-dialog";
import { AssetDetailSheet } from "./asset-detail-sheet";
import { MedicalSection } from "./medical-section";
import { BooksArt, CozyEmpty, PlantArt } from "@/components/cozy";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tab = "cars" | "home" | "medical";

const PROVIDER_ICON: Record<string, LucideIcon> = {
  internet: Wifi,
  mobile: Smartphone,
  tv: Tv,
  electricity: Zap,
  gas: Flame,
  utility: Zap,
  upravnik: Building2,
  komunala: Recycle,
  insurance: Shield,
  other: Box,
};

const TABS: { key: Tab; labelKey: string; icon: LucideIcon }[] = [
  { key: "cars", labelKey: "records.tabs.cars", icon: Car },
  { key: "home", labelKey: "records.tabs.home", icon: Home },
  { key: "medical", labelKey: "records.tabs.medical", icon: Stethoscope },
];

const attrStr = (a: Record<string, unknown>, k: string) => {
  const v = a[k];
  return v == null ? null : String(v);
};

function carSummary(a: Record<string, unknown>): string {
  const km = a.current_km ? `${Number(a.current_km).toLocaleString("sl-SI")} km` : null;
  return [a.engine, a.year, a.gearbox, km].filter(Boolean).join(" · ");
}

export function RecordsView({
  assets,
  entries,
  providers,
  medicalContacts,
  healthReminders,
  members,
  currentUserId,
}: {
  assets: AssetRow[];
  entries: MaintenanceRow[];
  providers: ProviderRow[];
  medicalContacts: MedicalContactRow[];
  healthReminders: HealthReminderRow[];
  members: Member[];
  currentUserId: string | null;
}) {
  const t = useT();
  const [tab, setTab] = useState<Tab>("cars");
  const [openAsset, setOpenAsset] = useState<AssetRow | null>(null);
  const [editProvider, setEditProvider] = useState<ProviderRow | null>(null);
  const [, startTransition] = useTransition();

  function mutate(fn: () => Promise<void>) {
    startTransition(async () => {
      try {
        await fn();
      } catch {
        toast.error(t("records.toast.updateFailed"));
      }
    });
  }

  const entriesByAsset = useMemo(() => {
    const map = new Map<string, MaintenanceRow[]>();
    for (const e of entries) {
      const arr = map.get(e.asset_id) ?? [];
      arr.push(e);
      map.set(e.asset_id, arr);
    }
    return map;
  }, [entries]);

  const cars = assets.filter((a) => a.type === "vehicle");
  const homeAssets = assets.filter((a) => a.type !== "vehicle");
  const homeIds = new Set(homeAssets.map((a) => a.id));
  const inspections = entries
    .filter((e) => e.next_service_on && homeIds.has(e.asset_id))
    .sort((x, y) => (x.next_service_on! < y.next_service_on! ? -1 : 1));
  const assetName = new Map(assets.map((a) => [a.id, a.name] as const));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("records.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("records.subtitle")}
        </p>
      </div>

      <div className="flex gap-2">
        {TABS.map((tabItem) => {
          const Icon = tabItem.icon;
          return (
            <button
              key={tabItem.key}
              type="button"
              onClick={() => setTab(tabItem.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                tab === tabItem.key
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-4" />
              {t(tabItem.labelKey)}
            </button>
          );
        })}
      </div>

      {/* ---- CARS ---- */}
      {tab === "cars" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <AssetDialog
              defaultType="vehicle"
              trigger={
                <Button>
                  <Plus />
                  {t("records.addCar")}
                </Button>
              }
            />
          </div>
          {cars.length === 0 ? (
            <EmptyState art={<PlantArt />} text={t("records.emptyCars")} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {cars.map((car) => {
                const list = entriesByAsset.get(car.id) ?? [];
                const total = list.reduce((s, e) => s + (e.cost ?? 0), 0);
                const reg = daysUntil(attrStr(car.attributes, "registration_due"));
                const ins = daysUntil(attrStr(car.attributes, "insurance_due"));
                return (
                  <div
                    key={car.id}
                    onClick={() => setOpenAsset(car)}
                    className="group relative flex cursor-pointer flex-col rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between">
                      <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Car className="size-5" />
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          mutate(() => deleteAsset(car.id));
                        }}
                        className="reveal-hover -m-1 rounded-md p-1 text-muted-foreground hover:text-destructive"
                        aria-label={t("records.deleteCar")}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <p className="mt-3 font-medium">{car.name}</p>
                    {carSummary(car.attributes) && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {carSummary(car.attributes)}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <DateChip label={t("records.regShort")} days={reg} />
                      <DateChip
                        label={
                          attrStr(car.attributes, "insurance_company")
                            ? `${t("records.insShort")} · ${attrStr(car.attributes, "insurance_company")}`
                            : t("records.insShort")
                        }
                        days={ins}
                      />
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Wrench className="size-3.5" />
                      {t("records.entryCount", { count: list.length })}
                      {total > 0 ? ` · ${formatMoney(total)}` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---- HOME ---- */}
      {tab === "home" && (
        <div className="space-y-6">
          {/* Apartment / property */}
          <Section
            title={t("records.home")}
            action={
              <AssetDialog
                defaultType="property"
                trigger={
                  <Button variant="outline" size="sm">
                    <Plus />
                    {t("records.add")}
                  </Button>
                }
              />
            }
          >
            {homeAssets.length === 0 ? (
              <EmptyState art={<PlantArt />} text={t("records.emptyHome")} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {homeAssets.map((asset) => {
                  const list = entriesByAsset.get(asset.id) ?? [];
                  const total = list.reduce((s, e) => s + (e.cost ?? 0), 0);
                  return (
                    <div
                      key={asset.id}
                      onClick={() => setOpenAsset(asset)}
                      className="group relative flex cursor-pointer flex-col rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
                    >
                      <div className="flex items-start justify-between">
                        <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                          <Home className="size-5" />
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            mutate(() => deleteAsset(asset.id));
                          }}
                          className="reveal-hover -m-1 rounded-md p-1 text-muted-foreground hover:text-destructive"
                          aria-label={t("records.delete")}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <p className="mt-3 font-medium">{asset.name}</p>
                      {attrStr(asset.attributes, "address") && (
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {attrStr(asset.attributes, "address")}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Wrench className="size-3.5" />
                        {t("records.entryCount", { count: list.length })}
                        {total > 0 ? ` · ${formatMoney(total)}` : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Upcoming inspections */}
          {inspections.length > 0 && (
            <Section title={t("records.inspectionsDue")}>
              <ul className="space-y-2">
                {inspections.map((e) => {
                  const days = daysUntil(e.next_service_on);
                  return (
                    <li
                      key={e.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <CalendarClock className="size-4 shrink-0 text-primary" />
                        <span className="truncate">
                          {e.title}
                          <span className="text-muted-foreground">
                            {" "}
                            · {assetName.get(e.asset_id)}
                          </span>
                        </span>
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-xs tabular-nums",
                          days != null && days < 0
                            ? "text-destructive"
                            : days != null && days <= 30
                              ? "text-primary"
                              : "text-muted-foreground",
                        )}
                      >
                        {formatDate(e.next_service_on)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}

          {/* Providers */}
          <Section
            title={t("records.providersTitle")}
            action={
              <ProviderDialog
                trigger={
                  <Button variant="outline" size="sm">
                    <Plus />
                    {t("records.add")}
                  </Button>
                }
              />
            }
          >
            {providers.length === 0 ? (
              <EmptyState
                art={<BooksArt />}
                text={t("records.emptyProviders")}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {providers.map((provider) => {
                  const Icon = PROVIDER_ICON[provider.type] ?? Box;
                  const days = daysUntil(provider.renewal_date);
                  return (
                    <div
                      key={provider.id}
                      className="group flex flex-col rounded-lg border border-border bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="size-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{provider.name}</p>
                            {provider.plan && (
                              <p className="truncate text-xs text-muted-foreground">
                                {provider.plan}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditProvider(provider)}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={t("records.editProvider")}
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => mutate(() => deleteProvider(provider.id))}
                            className="reveal-hover -m-1 rounded-md p-1 text-muted-foreground hover:text-destructive"
                            aria-label={t("records.deleteProvider")}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {provider.monthly_cost != null
                            ? `${formatMoney(provider.monthly_cost)}${t("records.perMonthShort")}`
                            : "—"}
                        </span>
                        {provider.renewal_date && (
                          <span
                            className={cn(
                              "text-xs",
                              days != null && days >= 0 && days <= 30
                                ? "text-destructive"
                                : "text-muted-foreground",
                            )}
                          >
                            {days != null && days >= 0
                              ? t("records.renewsIn", { count: days })
                              : t("records.renewedOn", {
                                  date: formatDate(provider.renewal_date),
                                })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </div>
      )}

      {/* ---- MEDICAL ---- */}
      {tab === "medical" && (
        <MedicalSection
          contacts={medicalContacts}
          reminders={healthReminders}
          members={members}
          currentUserId={currentUserId}
        />
      )}

      <AssetDetailSheet
        asset={openAsset}
        entries={openAsset ? (entriesByAsset.get(openAsset.id) ?? []) : []}
        open={Boolean(openAsset)}
        onOpenChange={(o) => {
          if (!o) setOpenAsset(null);
        }}
      />
      {editProvider && (
        <ProviderDialog
          provider={editProvider}
          open
          onOpenChange={(o) => {
            if (!o) setEditProvider(null);
          }}
        />
      )}
    </div>
  );
}

function DateChip({ label, days }: { label: string; days: number | null }) {
  const t = useT();
  if (days == null) {
    return (
      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
        {label}: —
      </span>
    );
  }
  const overdue = days < 0;
  const soon = days >= 0 && days <= 30;
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px]",
        overdue
          ? "border-destructive/40 bg-destructive/5 text-destructive"
          : soon
            ? "border-primary/40 bg-primary/5 text-primary"
            : "border-border text-muted-foreground",
      )}
    >
      {label}:{" "}
      {overdue
        ? t("records.daysOver", { count: Math.abs(days) })
        : t("records.daysLeft", { count: days })}
    </span>
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

function EmptyState({ art, text }: { art: ReactNode; text: string }) {
  return <CozyEmpty art={art}>{text}</CozyEmpty>;
}
