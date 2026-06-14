import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MansaMusaAI — AI Operating System for Business";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#050508",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow orb */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(212,132,26,0.25) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        {/* Grid lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(212,132,26,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(212,132,26,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 64, fontWeight: 900, color: "white", letterSpacing: "-3px" }}>
            MansaMusa
          </span>
          <span style={{ fontSize: 64, fontWeight: 900, color: "#d4841a", letterSpacing: "-3px" }}>
            AI
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 80,
            height: 2,
            background: "linear-gradient(90deg, transparent, #d4841a, transparent)",
            marginBottom: 20,
          }}
        />

        {/* Tagline */}
        <p style={{ fontSize: 26, color: "#9ca3af", margin: 0, letterSpacing: "0.02em" }}>
          AI Operating System for Business
        </p>

        {/* Tags */}
        <div style={{ display: "flex", gap: 12, marginTop: 36 }}>
          {["AI Agents", "Business Automation", "Fintech AI", "AI Productivity"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "8px 18px",
                borderRadius: 999,
                border: "1px solid rgba(212,132,26,0.35)",
                background: "rgba(212,132,26,0.08)",
                color: "#d4841a",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        {/* Bottom URL */}
        <p style={{ position: "absolute", bottom: 32, fontSize: 16, color: "#4b5563" }}>
          mansamusaai.vercel.app
        </p>
      </div>
    ),
    { ...size }
  );
}
