import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // BuddyLoan Partner CRM — light theme (TRD §16)
        navy: {
          DEFAULT: "#1A3C6B",
          50: "#eef3f9",
          700: "#1f4578",
          800: "#173258",
          900: "#11243f",
        },
        brand: {
          DEFAULT: "#2563EB",
          50: "#eff5ff",
          100: "#dbe7fe",
          600: "#2563EB",
          700: "#1d4ed8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "Sora", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(15,23,42,0.04), 0 1px 3px 0 rgba(15,23,42,0.06)",
        cardhover: "0 4px 12px -2px rgba(15,23,42,0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
