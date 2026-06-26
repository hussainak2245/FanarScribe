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
          50: "#fdf2f4",
          100: "#fce4e8",
          200: "#f9c0c9",
          300: "#f48898",
          400: "#e84062",
          500: "#D20A2E",
          600: "#A8071F",
          700: "#800616"
        },
        mist: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e7eb",
          300: "#d1d5db"
        },
        teal: {
          500: "#D20A2E",
          600: "#A8071F"
        },
        cyan: {
          400: "#e84062",
          500: "#D20A2E"
        },
        coral: {
          400: "#f48898",
          500: "#D20A2E"
        },
        magenta: {
          400: "#e84062",
          500: "#A8071F"
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
          500: "#800000"
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
