export const LOCALES = ["en", "sl"] as const;
export type Locale = (typeof LOCALES)[number];

/** Default UI language for the household (Slovenian); English is the fallback. */
export const DEFAULT_LOCALE: Locale = "sl";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  sl: "Slovenščina",
};

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "sl";
}
