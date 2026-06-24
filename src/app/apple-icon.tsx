import { ImageResponse } from "next/og";
import { BrandSvg } from "@/components/brand-mark";

// Apple touch icon for iOS "Add to Home Screen".
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <BrandSvg size={180} />
      </div>
    ),
    { ...size },
  );
}
