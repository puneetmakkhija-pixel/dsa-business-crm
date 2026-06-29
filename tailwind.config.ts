import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // DSA Command Center palette
        ink: {
          900: "#07111F",
          800: "#0B1D36",
          700: "#15315A",
        },
        slate: {
          fg: "#E8EEF6",
          muted: "#7E93B0",
          dim: "#6E84A3",
        },
        accent: {
          blue: "#5B8DEF",
          violet: "#7C5BEF",
          sky: "#7CA8FF",
          green: "#34D399",
          gold: "#E8B873",
          rose: "#FB7185",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "Sora", "sans-serif"],
      },
      keyframes: {
        riseIn: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        riseIn: "riseIn 0.4s ease",
      },
    },
  },
  plugins: [],
};

export default config;
