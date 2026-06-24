/** Casa Bevk brand mark: a little house with two pineapples on a sage square. */
export function BrandSvg({
  size = 512,
  rounded = true,
  className,
}: {
  size?: number;
  rounded?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Casa Bevk"
    >
      <rect width="512" height="512" rx={rounded ? 112 : 0} fill="#6B8E6B" />
      {/* house */}
      <path d="M256 150 L372 256 L140 256 Z" fill="#F7F5F0" />
      <rect x="170" y="248" width="172" height="132" rx="10" fill="#F7F5F0" />
      <rect x="234" y="322" width="44" height="58" rx="6" fill="#6B8E6B" />
      {/* left pineapple */}
      <ellipse cx="206" cy="388" rx="24" ry="30" fill="#E8B45A" />
      <path d="M206 342 L196 372 L216 372 Z" fill="#5E7A52" />
      <path d="M182 352 L204 374 L210 366 Z" fill="#5E7A52" />
      <path d="M230 352 L208 374 L202 366 Z" fill="#5E7A52" />
      {/* right pineapple */}
      <ellipse cx="306" cy="388" rx="24" ry="30" fill="#E8B45A" />
      <path d="M306 342 L296 372 L316 372 Z" fill="#5E7A52" />
      <path d="M282 352 L304 374 L310 366 Z" fill="#5E7A52" />
      <path d="M330 352 L308 374 L302 366 Z" fill="#5E7A52" />
    </svg>
  );
}

export function Logo({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return <BrandSvg size={size} className={className} />;
}
