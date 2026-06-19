import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          50: "#fff1f4",
          100: "#ffe4ea",
          200: "#fecdd8",
          300: "#fda4b8",
          400: "#fb6b8a",
          500: "#fa2a55",
          600: "#e31845",
          700: "#be1238"
        },
        mist: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e7eb",
          300: "#d1d5db"
        },
        teal: {
          500: "#fa2a55",
          600: "#e31845"
        },
        cyan: {
          400: "#fb6b8a",
          500: "#fa2a55"
        },
        coral: {
          400: "#fda4b8",
          500: "#fa2a55"
        },
        magenta: {
          400: "#fb6b8a",
          500: "#e31845"
        },
        plum: {
          500: "#665179",
          700: "#34233f",
          900: "#1c1324"
        },
        navy: {
          900: "#17212f"
        },
        ruby: {
          500: "#c93b55"
        },
        gold: {
          400: "#ddb654",
          500: "#c49328"
        }
      },
      boxShadow: {
        paper: "none",
        margin: "none"
      },
      borderRadius: {
        app: "8px"
      },
      backgroundImage: {
        "cloud-gradient": "none",
        "paper-gradient": "none",
        "teal-coral-glow": "none",
        "plum-mist-bg": "none"
      }
    }
  },
  plugins: []
};

export default config;
