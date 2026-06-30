export type Messages = { [key: string]: string | Messages };

/**
 * Resolve a dotted key path against a (possibly nested) messages object and
 * interpolate `{var}` placeholders. Falls back to the key itself if missing, so
 * a not-yet-translated string never breaks the UI.
 */
export function translate(
  messages: Messages,
  path: string,
  vars?: Record<string, string | number>,
): string {
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, messages);

  let str = typeof value === "string" ? value : path;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}

export type TFunction = (
  path: string,
  vars?: Record<string, string | number>,
) => string;
