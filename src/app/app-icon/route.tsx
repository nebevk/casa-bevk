import { ImageResponse } from "next/og";
import { BrandSvg } from "@/components/brand-mark";

/**
 * On-demand PNG app icon for the web manifest (Android/Chrome install).
 *   /app-icon?size=192
 *   /app-icon?size=512&maskable=1
 */
export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const size = Math.min(1024, Math.max(48, Number(searchParams.get("size")) || 512));
  const maskable = searchParams.get("maskable") === "1";

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <BrandSvg size={size} rounded={!maskable} />
      </div>
    ),
    { width: size, height: size },
  );
}
