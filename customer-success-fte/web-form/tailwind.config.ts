import type { Config } from "tailwindcss";
import { colors } from "./src/tokens/colors";
import { spacing, radii } from "./src/tokens/spacing";
import { typography } from "./src/tokens/typography";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        ...colors,
      },
      spacing: {
        ...spacing,
      },
      borderRadius: {
        ...radii,
      },
      fontFamily: {
        ...typography.fontFamily,
      },
      fontSize: {
        ...typography.fontSize,
      },
      fontWeight: {
        ...typography.fontWeight,
      },
      boxShadow: {
        sm: "0 2px 8px rgba(0,0,0,0.06)",
        md: "0 4px 16px rgba(0,0,0,0.1)",
        lg: "0 12px 32px rgba(0,0,0,0.15)",
        xl: "0 24px 64px rgba(0,0,0,0.2)",
        "glow-primary": "0 0 24px rgba(16,185,129,0.3)",
        "glow-warning": "0 0 24px rgba(245,158,11,0.3)",
        "glow-error": "0 0 24px rgba(239,68,68,0.3)",
        focus: "0 0 0 3px rgba(16,185,129,0.2)",
      },
      animation: {
        "fade-in": "fadeIn 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-up": "slideUp 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        "bounce-in": "bounceIn 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "spin-slow": "spin 2s linear infinite",
        float: "float 3s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        pulseGlow: {
          "0%, 100%": {
            opacity: "1",
            filter: "drop-shadow(0 0 4px rgba(16,185,129,0.3))",
          },
          "50%": {
            opacity: "0.8",
            filter: "drop-shadow(0 0 12px rgba(16,185,129,0.7))",
          },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      transitionDuration: {
        fast: "150ms",
        base: "250ms",
        slow: "400ms",
      },
      transitionTimingFunction: {
        "ease-out": "cubic-bezier(0.4, 0, 0.2, 1)",
        "ease-in": "cubic-bezier(0.4, 0, 1, 1)",
        "ease-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
