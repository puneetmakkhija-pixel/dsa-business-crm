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
        card: "0 1px 2px 0 rgba(15,23,42,0.03), 0 2px 6px -1px rgba(15,23,42,0.05)",
        cardhover: "0 10px 24px -8px rgba(15,23,42,0.14), 0 2px 6px -2px rgba(15,23,42,0.06)",
        ringbrand: "0 0 0 3px rgba(37,99,235,0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
