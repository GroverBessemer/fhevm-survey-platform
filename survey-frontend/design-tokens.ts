/**
 * Design Tokens for FHEVM Survey dApp
 * 
 * Generated using deterministic seed:
 * seed = sha256("FHEVMSurvey" + "sepolia" + "202510" + "Survey.sol")
 * 
 * Design System: Glassmorphism
 * Color Scheme: B (Blue/Cyan/Teal) - Professional Tech Style
 * Typography: Sans-Serif (Inter) - 1.25x scale
 * Layout: Responsive Sidebar
 * Component Style: 8px radius + medium shadow + 1px border
 * Transitions: 200ms standard
 */

export const designTokens = {
  system: "Glassmorphism",
  seed: "sha256(FHEVMSurveysepolia202510Survey.sol)",
  
  colors: {
    light: {
      primary: "#3B82F6",        // Blue
      secondary: "#06B6D4",      // Cyan
      accent: "#14B8A6",         // Teal
      background: "#FFFFFF",
      surface: "#F8FAFC",
      surfaceGlass: "rgba(248, 250, 252, 0.7)",
      text: "#0F172A",
      textSecondary: "#64748B",
      border: "#E2E8F0",
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
      hover: "#2563EB",
      encrypted: "#8B5CF6",      // Purple for encrypted indicators
    },
    dark: {
      primary: "#60A5FA",
      secondary: "#22D3EE",
      accent: "#2DD4BF",
      background: "#0F172A",
      surface: "#1E293B",
      surfaceGlass: "rgba(30, 41, 59, 0.7)",
      text: "#F8FAFC",
      textSecondary: "#94A3B8",
      border: "#334155",
      success: "#34D399",
      warning: "#FBBF24",
      error: "#F87171",
      hover: "#3B82F6",
      encrypted: "#A78BFA",
    },
  },
  
  typography: {
    fontFamily: {
      sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      mono: ["JetBrains Mono", "Fira Code", "monospace"],
    },
    scale: 1.25,
    sizes: {
      xs: "0.75rem",     // 12px
      sm: "0.875rem",    // 14px
      base: "1rem",      // 16px
      lg: "1.25rem",     // 20px
      xl: "1.563rem",    // 25px
      "2xl": "1.953rem", // 31px
      "3xl": "2.441rem", // 39px
      "4xl": "3.052rem", // 49px
    },
    lineHeight: {
      tight: "1.25",
      normal: "1.5",
      relaxed: "1.75",
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
  },
  
  spacing: {
    unit: 8, // 8px base unit
    scale: {
      "0": "0",
      "1": "0.25rem",  // 4px
      "2": "0.5rem",   // 8px
      "3": "0.75rem",  // 12px
      "4": "1rem",     // 16px
      "5": "1.25rem",  // 20px
      "6": "1.5rem",   // 24px
      "8": "2rem",     // 32px
      "10": "2.5rem",  // 40px
      "12": "3rem",    // 48px
      "16": "4rem",    // 64px
      "20": "5rem",    // 80px
    },
  },
  
  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "24px",
    full: "9999px",
  },
  
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.15)",
    xl: "0 20px 25px rgba(0, 0, 0, 0.2)",
    glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
  },
  
  transitions: {
    duration: {
      fast: "100ms",
      standard: "200ms",
      slow: "300ms",
    },
    easing: {
      default: "cubic-bezier(0.4, 0, 0.2, 1)",
      in: "cubic-bezier(0.4, 0, 1, 1)",
      out: "cubic-bezier(0, 0, 0.2, 1)",
      inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },
  
  layout: {
    sidebar: {
      width: "280px",
      widthCollapsed: "80px",
    },
    container: {
      maxWidth: "1280px",
    },
    header: {
      height: "64px",
    },
  },
  
  breakpoints: {
    mobile: "0px",      // < 768px
    tablet: "768px",    // 768px - 1024px
    desktop: "1024px",  // > 1024px
  },
  
  density: {
    compact: {
      padding: {
        sm: "4px 8px",
        md: "8px 16px",
        lg: "12px 24px",
      },
      gap: "8px",
    },
    comfortable: {
      padding: {
        sm: "8px 16px",
        md: "16px 24px",
        lg: "20px 32px",
      },
      gap: "16px",
    },
  },
  
  glassmorphism: {
    background: "rgba(255, 255, 255, 0.25)",
    backgroundDark: "rgba(30, 41, 59, 0.25)",
    backdropBlur: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    borderDark: "1px solid rgba(255, 255, 255, 0.1)",
  },
} as const;

export type DesignTokens = typeof designTokens;

