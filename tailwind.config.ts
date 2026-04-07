import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#0b1020",
        foreground: "#f5f7fb",
        surface: "#11182d",
        border: "rgba(148, 163, 184, 0.18)",
        accent: {
          DEFAULT: "#5eead4",
          foreground: "#06241f"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(94, 234, 212, 0.12), 0 20px 60px rgba(15, 23, 42, 0.45)"
      }
    }
  },
  plugins: []
};

export default config;