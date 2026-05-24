import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#16a34a",
          dark: "#15803d",
          light: "#dcfce7",
        },
        sidebar: {
          DEFAULT: "#0f172a",
          foreground: "#e2e8f0",
        },
      },
    },
  },
  plugins: [],
};

export default config;
