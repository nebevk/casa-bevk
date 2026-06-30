"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis } from "recharts";
import type { OverviewData } from "@/lib/expenses/overview";
import { formatMoney } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

// "up" (more spending) reads as the caution color; "down" (less) as sage.
const deltaTone = (delta: number) =>
  delta > 0 ? "text-destructive" : delta < 0 ? "text-primary" : "text-muted-foreground";

function DeltaArrow({ delta }: { delta: number }) {
  const Icon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : ArrowRight;
  return <Icon className="size-4 shrink-0" />;
}

export function SpendingOverview({ overview }: { overview: OverviewData }) {
  const t = useT();
  const { trend, kpis, breakdown, movers, includesRecurring } = overview;
  const hasAny = trend.some((p) => p.total > 0);

  const chartConfig = {
    logged: { label: t("finances.loggedLabel"), color: "var(--chart-1)" },
    fixed: { label: t("finances.fixedLabel"), color: "var(--chart-2)" },
  } satisfies ChartConfig;

  if (!hasAny) {
    return (
      <Card>
        <CardContent className="py-10">
          <p className="text-center text-sm text-muted-foreground">
            {t("finances.overviewEmpty")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const lastIdx = trend.length - 1;
  const pct = kpis.pctChange;

  return (
    <div className="space-y-6">
      {/* KPI delta cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label={t("finances.spentThisMonth")}
          value={formatMoney(kpis.currentTotal)}
        >
          <span className={cn("flex items-center gap-1", deltaTone(kpis.delta))}>
            <DeltaArrow delta={kpis.delta} />
            {formatMoney(Math.abs(kpis.delta))} {t("finances.vsLastMonth")}
          </span>
        </KpiCard>

        <KpiCard
          label={t("finances.changeVsLast")}
          value={pct == null ? "—" : `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`}
        >
          <span className={cn("flex items-center gap-1", deltaTone(kpis.delta))}>
            <DeltaArrow delta={kpis.delta} />
            {formatMoney(kpis.prevTotal)} {t("finances.lastMonth")}
          </span>
        </KpiCard>

        <KpiCard
          label={t("finances.vsAvg3")}
          value={`${kpis.vsAvg3 > 0 ? "+" : ""}${formatMoney(kpis.vsAvg3)}`}
          valueClassName={deltaTone(kpis.vsAvg3)}
        >
          <span className="text-muted-foreground">
            {t("finances.avgAmount", { amount: formatMoney(kpis.avg3) })}
          </span>
        </KpiCard>
      </div>

      {/* Headline trend */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">
            {t("finances.trendTitle")}
          </CardTitle>
          <CardDescription>
            {t("finances.trendDesc", { count: trend.length })}
            {includesRecurring ? ` · ${t("finances.includesRecurring")}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <BarChart accessibilityLayer data={trend} margin={{ left: 4, right: 4, top: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span
                            className="size-2 rounded-[2px]"
                            style={{ background: item.color }}
                          />
                          {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                        </span>
                        <span className="font-medium tabular-nums text-foreground">
                          {formatMoney(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="logged" stackId="s" fill="var(--color-logged)" radius={includesRecurring ? [0, 0, 4, 4] : 4}>
                {trend.map((_, i) => (
                  <Cell key={i} fillOpacity={i === lastIdx ? 1 : 0.55} />
                ))}
              </Bar>
              {includesRecurring && (
                <Bar dataKey="fixed" stackId="s" fill="var(--color-fixed)" radius={[4, 4, 0, 0]}>
                  {trend.map((_, i) => (
                    <Cell key={i} fillOpacity={i === lastIdx ? 1 : 0.55} />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              {t("finances.byCategory")}
            </CardTitle>
            <CardDescription>{overview.currentLabel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {breakdown.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("finances.overviewEmpty")}
              </p>
            ) : (
              breakdown.map((slice, i) => (
                <div key={slice.id ?? "uncat"} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium">{slice.name}</span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                      {formatMoney(slice.amount)}
                      <span className="ml-1.5 text-xs">
                        {(slice.share * 100).toFixed(0)}%
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(2, slice.share * 100)}%`,
                        background: `var(--chart-${(i % 5) + 1})`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top movers */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              {t("finances.topMovers")}
            </CardTitle>
            <CardDescription>{t("finances.topMoversDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {movers.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("finances.noMovers")}
              </p>
            ) : (
              <div className="space-y-2">
                {movers.map((m) => (
                  <div
                    key={m.id ?? "uncat"}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {m.name}
                    </span>
                    <span
                      className={cn(
                        "flex shrink-0 items-center gap-1 text-sm tabular-nums",
                        deltaTone(m.delta),
                      )}
                    >
                      <DeltaArrow delta={m.delta} />
                      {m.delta > 0 ? "+" : "−"}
                      {formatMoney(Math.abs(m.delta))}
                      {m.pct != null && (
                        <span className="text-xs">
                          {" "}
                          {m.delta > 0 ? "+" : "−"}
                          {Math.abs(m.pct).toFixed(0)}%
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  valueClassName,
  children,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("font-heading text-xl font-semibold tabular-nums", valueClassName)}>
          {value}
        </p>
        <p className="text-xs tabular-nums">{children}</p>
      </CardContent>
    </Card>
  );
}
