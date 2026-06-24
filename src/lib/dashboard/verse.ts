import "server-only";

export type DailyVerse = {
  text: string;
  reference: string;
  version?: string;
};

// Curated, warm fallbacks (home / love / gratitude) used when the API is
// unreachable — so the card always shows something nice, even offline.
const FALLBACK: DailyVerse[] = [
  { text: "Above all, love each other deeply, because love covers over a multitude of sins.", reference: "1 Peter 4:8" },
  { text: "And over all these virtues put on love, which binds them all together in perfect unity.", reference: "Colossians 3:14" },
  { text: "Two are better than one, because they have a good return for their labor.", reference: "Ecclesiastes 4:9" },
  { text: "As for me and my household, we will serve the Lord.", reference: "Joshua 24:15" },
  { text: "Unless the Lord builds the house, the builders labor in vain.", reference: "Psalm 127:1" },
  { text: "This is the day the Lord has made; let us rejoice and be glad in it.", reference: "Psalm 118:24" },
  { text: "Be completely humble and gentle; be patient, bearing with one another in love.", reference: "Ephesians 4:2" },
  { text: "A cheerful heart is good medicine.", reference: "Proverbs 17:22" },
  { text: "His compassions never fail. They are new every morning; great is your faithfulness.", reference: "Lamentations 3:22-23" },
  { text: "Love is patient, love is kind. It does not envy, it does not boast.", reference: "1 Corinthians 13:4" },
  { text: "Do not be anxious about anything, and the peace of God will guard your hearts and minds.", reference: "Philippians 4:6-7" },
  { text: "Be devoted to one another in love. Honor one another above yourselves.", reference: "Romans 12:10" },
];

/**
 * Verse of the day. Tries OurManna's curated VOTD API (cached ~12h, 4s timeout);
 * falls back to a curated local verse picked deterministically by the day.
 */
export async function getDailyVerse(): Promise<DailyVerse> {
  try {
    const res = await fetch(
      "https://beta.ourmanna.com/api/v1/get/?format=json&order=daily",
      { signal: AbortSignal.timeout(4000), next: { revalidate: 43_200 } },
    );
    if (res.ok) {
      const data = await res.json();
      const d = data?.verse?.details;
      if (d?.text && d?.reference) {
        return {
          text: String(d.text).trim(),
          reference: String(d.reference).trim(),
          version: d.version ? String(d.version) : undefined,
        };
      }
    }
  } catch {
    // network / timeout / parse error — use a curated verse below
  }

  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return FALLBACK[dayIndex % FALLBACK.length];
}
