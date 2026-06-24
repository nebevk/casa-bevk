import "server-only";

export type WeatherDay = {
  date: string;
  code: number;
  max: number;
  min: number;
};

export type Weather = {
  current: { temp: number; code: number };
  forecast: WeatherDay[]; // next 3 days (excluding today)
  sunrise: string;
  sunset: string;
} | null;

// Radovljica, Slovenia.
const LAT = 46.3442;
const LON = 14.1736;

/** Current conditions + a short forecast from Open-Meteo (free, no key). */
export async function getWeather(): Promise<Weather> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
      `&timezone=Europe%2FLjubljana&forecast_days=4`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const d = await res.json();

    const times: string[] = d?.daily?.time ?? [];
    const days: WeatherDay[] = times.map((date, i) => ({
      date,
      code: d.daily.weather_code[i],
      max: Math.round(d.daily.temperature_2m_max[i]),
      min: Math.round(d.daily.temperature_2m_min[i]),
    }));
    if (days.length === 0) return null;

    return {
      current: {
        temp: Math.round(d?.current?.temperature_2m ?? days[0].max),
        code: d?.current?.weather_code ?? days[0].code,
      },
      forecast: days.slice(1, 4),
      sunrise: d?.daily?.sunrise?.[0] ?? "",
      sunset: d?.daily?.sunset?.[0] ?? "",
    };
  } catch {
    return null;
  }
}
