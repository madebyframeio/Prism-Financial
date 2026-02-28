// Centralized Theme Configuration for Prism Financial
// Establishes an ultra-premium "Prism Black" luxury aesthetic.

const financeTheme = {
    colors: {
        primary: "#008450",       // Prisim Finance Green
        secondary: "#004B8D",     // Corporate blue for links
        accent: "#FCCC44",        // Prisim Finance Yellow
        "accent-dark": "#D5A106",
        surface: "#F4F4F4",       // Light gray surface
        "surface-highlight": "#FFFFFF",
        success: "#008450",       // Trustworthy green
        warning: "#008450",
        danger: "#008450",
        header: "#008450",
        text: {
            DEFAULT: "#333333",   // Near black for readability
            dim: "#666666",
            gold: "#008450"        // Use green for highlight
        }
    },
    fontFamily: {
        sans: ["'Inter'", "sans-serif"],
        serif: ["'Source Serif 4'", "serif"],
        mono: ["'Space Mono'", "monospace"],
    },
    borderRadius: {
        "none": "0px",
        "sm": "2px",
        DEFAULT: "4px",
        "md": "6px",
        "lg": "8px",
        "xl": "12px",
        "2xl": "16px",
        "full": "9999px",
    },
    boxShadow: {
        "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "DEFAULT": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "finance": "0 2px 10px rgba(0, 0, 0, 0.05)",
        "gold-glow": "none", // Remove glowing effects
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
