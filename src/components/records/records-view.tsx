"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Box,
  Car,
  Home,
  Pencil,
  Plus,
  Shield,
  Smartphone,
  Trash2,
  Tv,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type {
  AssetRow,
  MaintenanceRow,
  ProviderRow,
} from "@/lib/records/queries";
import { deleteAsset, deleteProvider } from "@/lib/records/actions";
import { daysUntil, formatDate, formatMoney } from "@/lib/format";
import { AssetDialog } from "./asset-dialog";
import { ProviderDialog } from "./provider-dialog";
import { AssetDetailSheet } from "./asset-detail-sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ASSET_ICON: Record<string, LucideIcon> = {
  vehicle: Car,
  property: Home,
  other: Box,
};
const PROVIDER_ICON: Record<string, LucideIcon> = {
  internet: Wifi,
  mobile: Smartphone,
  tv: Tv,
  utility: Zap,
  insurance: Shield,
  other: Box,
};

type Mutate = (fn: () => Promise<void> | void) => void;

function assetSummary(asset: AssetRow): string {
  const a = asset.attributes;
  if (asset.type === "vehicle") {
    return [a.make, a.model, a.year, a.plate].filter(Boolean).join(" · ");
  }
  if (asset.type === "property") {
    return [a.address, a.size_m2 ? `${a.size_m2} m²` : null]
      .filter(Boolean)
      .join(" · ");
  }
  return "";
}

export function RecordsView({
  assets,
  entries,
  providers,
}: {
  assets: AssetRow[];
  entries: MaintenanceRow[];
  providers: ProviderRow[];
}) {
  const [tab, setTab] = useState<"assets" | "providers">("assets");
  const [openAsset, setOpenAsset] = useState<AssetRow | null>(null);
  const [editProvider, setEditProvider] = useState<ProviderRow | null>(null);
  const [, startTransition] = useTransition();
  const mutate: Mutate = (fn) => startTransition(fn);

  const entriesByAsset = useMemo(() => {
    const map = new Map<string, MaintenanceRow[]>();
    for (const e of entries) {
      const arr = map.get(e.asset_id) ?? [];
      arr.push(e);
      map.set(e.asset_id, arr);
    }
    return map;
  }, [entries]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Records
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cars, the apartment, and providers — info, logs &amp; costs in one
          place.
        </p>
      </div>

      <div className="flex gap-2">
        {(["assets", "providers"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              tab === t
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {t === "assets" ? "Vehicles & Property" : "Providers"}
          </button>
        ))}
      </div>

      {tab === "assets" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <AssetDialog
              trigger={
                <Button>
                  <Plus />
                  Add record
                </Button>
              }
            />
          </div>
          {assets.length === 0 ? (
            <EmptyState
              icon={Car}
              text="No vehicles or property yet — add your car or apartment."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {assets.map((asset) => {
                const Icon = ASSET_ICON[asset.type] ?? Box;
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
                        <Icon className="size-5" />
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          mutate(() => deleteAsset(asset.id));
                        }}
                        className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                        aria-label="Delete record"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <p className="mt-3 font-medium">{asset.name}</p>
                    {assetSummary(asset) && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {assetSummary(asset)}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Wrench className="size-3.5" />
                      {list.length} {list.length === 1 ? "entry" : "entries"}
                      {total > 0 ? ` · ${formatMoney(total)}` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <ProviderDialog
              trigger={
                <Button>
                  <Plus />
                  Add provider
                </Button>
              }
            />
          </div>
          {providers.length === 0 ? (
            <EmptyState
              icon={Wifi}
              text="No providers yet — add internet, mobile, TV…"
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
                          aria-label="Edit provider"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => mutate(() => deleteProvider(provider.id))}
                          className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                          aria-label="Delete provider"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {provider.monthly_cost != null
                          ? `${formatMoney(provider.monthly_cost)}/mo`
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
                            ? `Renews in ${days}d`
                            : `Renewed ${formatDate(provider.renewal_date)}`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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

function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/50 py-16 text-center">
      <Icon className="mx-auto size-8 text-muted-foreground/60" />
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
