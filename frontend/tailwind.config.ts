import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#336B4B",
          light:   "#7DB87A",
          glow:    "rgba(51, 107, 75, 0.20)",
        },
        secondary: "#7DB87A",
        accent:    "#1C3829",
        background: {
          deep:      "#F0EDE4",
          slate:     "#E5E0D5",
          card:      "rgba(255, 255, 255, 0.58)",
          cardHover: "rgba(255, 255, 255, 0.80)",
        },
        foreground: {
          main:  "#1C3829",
          muted: "#2A5240",
          dim:   "#336B4B",
        },
        border: {
          glass:  "rgba(51, 107, 75, 0.14)",
          active: "rgba(51, 107, 75, 0.32)",
        },
      },
      fontFamily: {
        inter:  ["var(--font-inter)", "sans-serif"],
        outfit: ["var(--font-outfit)", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "24px",
      },
      boxShadow: {
        premium: "0 10px 25px -5px rgba(4, 57, 21, 0.14), 0 8px 10px -6px rgba(4, 57, 21, 0.08)",
        glow:    "0 0 20px rgba(76, 118, 59, 0.10)",
      },
    },
  },
  plugins: [],
} satisfies Config;
