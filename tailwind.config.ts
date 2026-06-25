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
          50: "#fde8e8",
          100: "#fbd1d1",
          200: "#f5a3a3",
          300: "#e96767",
          400: "#c03030",
          500: "#800000",
          600: "#6b0000",
          700: "#560000"
        },
        mist: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e7eb",
          300: "#d1d5db"
        },
        teal: {
          500: "#800000",
          600: "#6b0000"
        },
        cyan: {
          400: "#c03030",
          500: "#800000"
        },
        coral: {
          400: "#e96767",
          500: "#800000"
        },
        magenta: {
          400: "#c03030",
          500: "#6b0000"
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
