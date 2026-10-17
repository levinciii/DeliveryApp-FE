import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#FFFFFF",
        canvas: "#F7F8F6",
        ink: "#12151A",
        muted: "#5B6472",
        primary: {
          DEFAULT: "#0B6E4F",
          dark: "#075237",
        },
        accent: "#F5A623",
        danger: "#D64545",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
