import "server-only";

/** Slovenian public holidays (Nager.Date, free, no key) as { "YYYY-MM-DD": name }. */
export async function getHolidays(
  years: number[],
): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  await Promise.all(
    years.map(async (year) => {
      try {
        const res = await fetch(
          `https://date.nager.at/api/v3/PublicHolidays/${year}/SI`,
          { signal: AbortSignal.timeout(4000), next: { revalidate: 604_800 } },
        );
        if (!res.ok) return;
        const data: { date: string; localName?: string; name?: string }[] =
          await res.json();
        for (const h of data) {
          if (h.date && !map[h.date]) map[h.date] = h.localName || h.name || "";
        }
      } catch {
        // ignore — holidays are a nice-to-have overlay
      }
    }),
  );
  return map;
}
