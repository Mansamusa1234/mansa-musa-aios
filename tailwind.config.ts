import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card:           "0 1px 3px rgb(0 0 0 / 0.08), 0 1px 2px rgb(0 0 0 / 0.06)",
        "card-md":      "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
        "card-lg":      "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
        "glow-brand":   "0 0 30px rgb(99 102 241 / 0.25)",
        "glow-sm":      "0 0 15px rgb(99 102 241 / 0.15)",
        "inset-border": "inset 0 0 0 1px rgb(255 255 255 / 0.08)",
        "focus-brand":  "0 0 0 3px rgb(99 102 241 / 0.25)",
      },
      backgroundImage: {
        "gradient-brand":   "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
        "gradient-brand-r": "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
        "gradient-dark":    "linear-gradient(135deg, #0a0a18 0%, #070712 100%)",
      },
      animation: {
        "fade-in":     "fadeIn 0.25s ease-out",
        "slide-up":    "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down":  "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in":    "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-soft":  "pulseSoft 2s ease-in-out infinite",
        "sweep":       "sweep 3s linear infinite",
        "shimmer":     "shimmer 1.5s linear infinite",
        "bounce-soft": "bounceSoft 1s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:     { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp:    { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        slideDown:  { "0%": { opacity: "0", transform: "translateY(-10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        scaleIn:    { "0%": { opacity: "0", transform: "scale(0.95)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        pulseSoft:  { "0%, 100%": { opacity: "0.6" }, "50%": { opacity: "1" } },
        sweep:      { "0%": { backgroundPosition: "0% center" }, "100%": { backgroundPosition: "200% center" } },
        shimmer:    { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        bounceSoft: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-4px)" } },
      },
    },
  },
  plugins: [],
};

export default config;
