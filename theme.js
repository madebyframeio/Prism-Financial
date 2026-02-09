// Centralized Theme Configuration for Prism Financial
// Establishes a professional, conservative "Finance" aesthetic.

const financeTheme = {
    colors: {
        primary: "#1e293b",    // Slate 800 - Professional, Solid, Secure
        secondary: "#334155",  // Slate 700 - Neutral text
        accent: "#059669",     // Emerald 600 - Freshness, Detail
        "accent-dark": "#047857", // Emerald 700
        surface: "#F8FAFC",    // Slate 50 - clean background
        "surface-highlight": "#FFFFFF",
        success: "#059669",    // Emerald 600
        warning: "#d97706",    // Amber 600
        danger: "#DC2626",     // Red 600
        header: "#FFFFFF",
    },
    fontFamily: {
        sans: ["'Urbanist'", "sans-serif"],
        serif: ["'Urbanist'", "sans-serif"], // For Headings
        mono: ["'Space Mono'", "monospace"], // For financial data
    },
    borderRadius: {
        "none": "0px",
        "sm": "2px",
        DEFAULT: "2px",
        "md": "4px",
        "lg": "4px",
        "xl": "6px",
        "2xl": "8px",
        "3xl": "12px",
        "full": "9999px",
    },
    boxShadow: {
        "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "DEFAULT": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "finance": "0 4px 20px -2px rgba(11, 25, 44, 0.15)", // Custom subtle shadow
    }
};

// Apply to Tailwind Config
if (typeof tailwind !== 'undefined') {
    tailwind.config = {
        darkMode: "class",
        theme: {
            extend: {
                colors: financeTheme.colors,
                fontFamily: financeTheme.fontFamily,
                borderRadius: financeTheme.borderRadius,
                boxShadow: financeTheme.boxShadow
            }
        }
    };
}
