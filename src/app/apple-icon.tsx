import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 36,
        }}
      >
        <span
          style={{
            fontSize: 130,
            fontWeight: 900,
            color: "#FA2A55",
            lineHeight: 1,
            fontFamily: "serif",
          }}
        >
          S
        </span>
      </div>
    ),
    { width: 180, height: 180 }
  );
}
