import { cn } from "@/lib/utils";

/** Casa Bevk brand mark: the logo centered on the sage square. */
export function Logo({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const inner = Math.round(size * 0.9);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden bg-primary",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/casabevk_logo.png"
        alt="Casa Bevk"
        width={inner}
        height={inner}
        style={{ objectFit: "contain" }}
      />
    </span>
  );
}
