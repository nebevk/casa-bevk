import { ImageResponse } from "next/og";

// Apple touch icon for iOS "Add to Home Screen".
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 92,
          fontWeight: 700,
          fontFamily: "serif",
        }}
      >
        CB
      </div>
    ),
    { ...size },
  );
}
