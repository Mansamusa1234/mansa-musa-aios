import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "96px",
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: 200,
            fontWeight: 900,
            fontFamily: "serif",
            lineHeight: 1,
            letterSpacing: "-8px",
          }}
        >
          MM
        </span>
      </div>
    ),
    { ...size }
  );
}
