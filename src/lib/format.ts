/** Shared, dependency-free formatting helpers (safe in client and server). */

export function formatMoney(
  amount: number | null | undefined,
  currency = "EUR",
): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Whole days from now until `date` (negative = in the past), or null. */
export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

/** Today's date as a local `YYYY-MM-DD` string, for <input type="date"> defaults. */
export function todayDateInput(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
