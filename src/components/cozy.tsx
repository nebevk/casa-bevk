import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Casa Bevk — cosy hand-drawn line art (Sage & Linen).
 * Plants = growth, books = learning/becoming our best, a warm home for the two
 * of us. Pure SVG, themed via `currentColor` (set text color on the wrapper).
 */

type ArtProps = { className?: string };

/** A little plant growing from a pot — growth. */
export function PlantArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden className={cn("size-full", className)}>
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 31 h18 l-2 12 h-14 z" fill="currentColor" fillOpacity="0.06" />
        <path d="M13.5 31 h21" />
        <path d="M24 31 V15" />
        <path d="M24 26 C18 25 15 21 14 15 c6 0 9 3 10 8" fill="currentColor" fillOpacity="0.1" />
        <path d="M24 23 C30 22 33 18 34 12 c-6 0 -9 3 -10 8" fill="currentColor" fillOpacity="0.1" />
        <path d="M24 18 c0 -4 2 -7 5 -9" />
      </g>
    </svg>
  );
}

/** A small stack of books — self-growth & learning. */
export function BooksArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden className={cn("size-full", className)}>
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="11" y="31" width="26" height="7" rx="1.5" fill="currentColor" fillOpacity="0.06" />
        <rect x="13" y="23" width="23" height="7" rx="1.5" fill="currentColor" fillOpacity="0.06" />
        <rect x="10" y="15" width="21" height="7" rx="1.5" fill="currentColor" fillOpacity="0.06" />
        <path d="M16 31 v7 M16 23 v7 M15 15 v7" />
      </g>
    </svg>
  );
}

/** A warm mug — a calm moment at home. */
export function MugArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden className={cn("size-full", className)}>
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 23 h18 v10 a5 5 0 0 1 -5 5 h-8 a5 5 0 0 1 -5 -5 z" fill="currentColor" fillOpacity="0.06" />
        <path d="M32 26 h3.5 a3.5 3.5 0 0 1 0 7 H32" />
        <path d="M19 19 c-1.2 -2 0.8 -3.2 -0.2 -5.4" opacity="0.6" />
        <path d="M25 19 c-1.2 -2 0.8 -3.2 -0.2 -5.4" opacity="0.6" />
      </g>
    </svg>
  );
}

/** A trailing leafy vine — a soft botanical accent. */
export function VineArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 120 28" fill="none" aria-hidden className={className}>
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 8 C24 8 28 18 48 18 C68 18 72 8 94 8 C104 8 110 11 118 13" />
        <path d="M16 9 c-2.5 -4 -0.5 -8 3.5 -8.5 c0.3 4 -1 7.2 -3.5 8.5 z" fill="currentColor" fillOpacity="0.12" />
        <path d="M36 16.5 c4 -2.5 8.2 -0.6 9.2 3.6 c-4 1.2 -7.4 -0.2 -9.2 -3.6 z" fill="currentColor" fillOpacity="0.12" />
        <path d="M60 16.5 c-4 -2.5 -8.2 -0.6 -9.2 3.6 c4 1.2 7.4 -0.2 9.2 -3.6 z" fill="currentColor" fillOpacity="0.12" />
        <path d="M82 9 c2.5 -4 0.5 -8 -3.5 -8.5 c-0.3 4 1 7.2 3.5 8.5 z" fill="currentColor" fillOpacity="0.12" />
      </g>
    </svg>
  );
}

/** A little home library — a shelf of books and a plant. */
export function ShelfArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 128 64" fill="none" aria-hidden className={className}>
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 50 h112" />
        <rect x="16" y="26" width="8" height="24" rx="1.2" fill="currentColor" fillOpacity="0.06" />
        <rect x="26" y="20" width="8" height="30" rx="1.2" fill="currentColor" fillOpacity="0.06" />
        <rect x="36" y="30" width="8" height="20" rx="1.2" fill="currentColor" fillOpacity="0.06" />
        <g transform="rotate(11 50 40)">
          <rect x="46" y="28" width="8" height="22" rx="1.2" fill="currentColor" fillOpacity="0.06" />
        </g>
        <rect x="70" y="24" width="8" height="26" rx="1.2" fill="currentColor" fillOpacity="0.06" />
        <rect x="80" y="30" width="8" height="20" rx="1.2" fill="currentColor" fillOpacity="0.06" />
        <path d="M100 42 h14 l-1.5 8 h-11 z" fill="currentColor" fillOpacity="0.06" />
        <path d="M107 42 V30" />
        <path d="M107 36 c-4 -1 -6.5 -4 -7 -9 c4.5 0.5 6.5 3 7 7" fill="currentColor" fillOpacity="0.1" />
        <path d="M107 33 c4 -1 6.5 -4 7 -9 c-4.5 0.5 -6.5 3 -7 7" fill="currentColor" fillOpacity="0.1" />
      </g>
    </svg>
  );
}

/** Warm, illustrated empty state used across the app. */
export function CozyEmpty({
  art,
  children,
  className,
}: {
  art: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border bg-card/40 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mx-auto mb-3 size-16 text-primary/70">{art}</div>
      <p className="mx-auto max-w-xs text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
