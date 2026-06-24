import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  Sunrise,
  Sunset,
  type LucideIcon,
} from "lucide-react";
import type { Weather } from "@/lib/dashboard/weather";
import { Card, CardContent } from "@/components/ui/card";

function wmo(code: number): { Icon: LucideIcon; label: string } {
  if (code === 0) return { Icon: Sun, label: "Clear" };
  if (code === 1 || code === 2) return { Icon: CloudSun, label: "Partly cloudy" };
  if (code === 3) return { Icon: Cloud, label: "Overcast" };
  if (code === 45 || code === 48) return { Icon: CloudFog, label: "Fog" };
  if (code >= 51 && code <= 57) return { Icon: CloudDrizzle, label: "Drizzle" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return { Icon: CloudRain, label: "Rain" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return { Icon: CloudSnow, label: "Snow" };
  if (code >= 95) return { Icon: CloudLightning, label: "Storm" };
  return { Icon: Cloud, label: "Cloudy" };
}

const dayLabel = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
  });
const fmtTime = (iso: string) =>
  iso
    ? new Date(iso).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export function WeatherCard({ weather }: { weather: Weather }) {
  if (!weather) return null;
  const now = wmo(weather.current.code);
  const NowIcon = now.Icon;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <NowIcon className="size-10 shrink-0 text-primary" />
          <div>
            <p className="text-3xl font-semibold tabular-nums">
              {weather.current.temp}°
            </p>
            <p className="text-sm text-muted-foreground">
              {now.label} · Radovljica
            </p>
            <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Sunrise className="size-3.5" />
                {fmtTime(weather.sunrise)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Sunset className="size-3.5" />
                {fmtTime(weather.sunset)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-5">
          {weather.forecast.map((d) => {
            const w = wmo(d.code);
            const Icon = w.Icon;
            return (
              <div key={d.date} className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  {dayLabel(d.date)}
                </span>
                <Icon className="size-5 text-muted-foreground" />
                <span className="text-xs tabular-nums">
                  <span className="font-medium">{d.max}°</span>{" "}
                  <span className="text-muted-foreground">{d.min}°</span>
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
