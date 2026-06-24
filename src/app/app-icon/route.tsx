import { ImageResponse } from "next/og";

/**
 * On-demand PNG app icon: the brand logo composited on the sage square.
 * Used for the manifest, the apple touch icon, and the favicon.
 *   /app-icon?size=192
 *   /app-icon?size=512&maskable=1
 */
export function GET(request: Request) {
  const url = new URL(request.url);
  const size = Math.min(1024, Math.max(48, Number(url.searchParams.get("size")) || 512));
  const maskable = url.searchParams.get("maskable") === "1";
  const inner = Math.round(size * (maskable ? 0.74 : 0.86));
  const logo = `${url.origin}/casabevk_logo.png`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#6B8E6B",
          borderRadius: maskable ? 0 : Math.round(size * 0.22),
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt=""
          width={inner}
          height={inner}
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    { width: size, height: size },
  );
}
