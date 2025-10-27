import type { Config } from "tailwindcss";
import { designTokens } from "./design-tokens";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: designTokens.colors.light.primary,
        secondary: designTokens.colors.light.secondary,
        accent: designTokens.colors.light.accent,
        success: designTokens.colors.light.success,
        warning: designTokens.colors.light.warning,
        error: designTokens.colors.light.error,
        encrypted: designTokens.colors.light.encrypted,
      },
      fontFamily: {
        sans: [...designTokens.typography.fontFamily.sans],
        mono: [...designTokens.typography.fontFamily.mono],
      },
      fontSize: designTokens.typography.sizes,
      borderRadius: designTokens.borderRadius,
      boxShadow: designTokens.shadows,
      transitionDuration: {
        DEFAULT: designTokens.transitions.duration.standard,
        fast: designTokens.transitions.duration.fast,
        slow: designTokens.transitions.duration.slow,
      },
      transitionTimingFunction: {
        DEFAULT: designTokens.transitions.easing.default,
      },
      backdropBlur: {
        glass: "10px",
      },
    },
  },
  plugins: [],
};

export default config;

