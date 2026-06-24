/** The Casa Bevk logo image (line-art). Place it on a dark/sage background. */
export function LogoImage({
  size = 64,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/casabevk_logo.png"
      alt="Casa Bevk"
      width={size}
      height={size}
      className={className}
    />
  );
}
