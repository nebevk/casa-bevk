import type { Locale } from "../config";
import type { Messages } from "../translate";
import { en } from "./en";
import { sl } from "./sl";

function deepMerge(base: Messages, over: Messages): Messages {
  const out: Messages = { ...base };
  for (const key of Object.keys(over)) {
    const b = base[key];
    const o = over[key];
    if (b && o && typeof b === "object" && typeof o === "object") {
      out[key] = deepMerge(b as Messages, o as Messages);
    } else {
      out[key] = o;
    }
  }
  return out;
}

/** Slovenian falls back to English for any missing key, so coverage never breaks. */
export function getDictionary(locale: Locale): Messages {
  return locale === "sl" ? deepMerge(en, sl) : en;
}

export { en, sl };
