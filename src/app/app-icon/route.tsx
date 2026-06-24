import { ImageResponse } from "next/og";

/**
 * On-demand PNG app icon, used by the web manifest (Android/Chrome install).
 *   /app-icon?size=192
 *   /app-icon?size=512&maskable=1
 */
export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const size = Math.min(1024, Math.max(48, Number(searchParams.get("size")) || 512));
  const maskable = searchParams.get("maskable") === "1";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#6B8E6B",
          color: "#F7F5F0",
          // maskable icons need a safe zone, so the glyph is smaller and the
          // background is full-bleed (no rounded corners — the OS masks it).
          fontSize: Math.round(size * (maskable ? 0.42 : 0.52)),
          fontWeight: 700,
          fontFamily: "serif",
          borderRadius: maskable ? 0 : Math.round(size * 0.22),
        }}
      >
        CB
      </div>
    ),
    { width: size, height: size },
  );
}
