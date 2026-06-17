import { ImageResponse } from "next/og";
import { createElement } from "react";

export const runtime = "edge";

export function GET() {
  // Maskable icons must fill the full canvas — no border-radius, content within the 80% safe zone
  return new ImageResponse(
    createElement(
      "div",
      {
        style: {
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
      createElement(
        "span",
        {
          style: {
            color: "white",
            fontSize: 180,
            fontWeight: 900,
            fontFamily: "serif",
            lineHeight: 1,
            letterSpacing: "-8px",
          },
        },
        "MM"
      )
    ),
    { width: 512, height: 512 }
  );
}
