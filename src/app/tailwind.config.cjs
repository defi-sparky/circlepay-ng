/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:           "var(--bg)",
          surface:      "var(--surface)",
          card:         "var(--card)",
          border:       "var(--border)",
          muted:        "var(--muted)",
          green:        "var(--green)",
          "green-dim":  "var(--green-dim)",
          gold:         "var(--gold)",
          blue:         "var(--blue)",
          text:         "var(--text)",
          "text-muted": "var(--text-muted)",
        },
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        body:    ["var(--font-dm-sans)", "sans-serif"],
        mono:    ["var(--font-jetbrains)", "monospace"],
      },
      backgroundImage: {
        "glow-green": "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,232,122,0.12) 0%, transparent 70%)",
        "glow-blue":  "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(61,126,255,0.10) 0%, transparent 70%)",
      },
      boxShadow: {
        "glow-green":    "0 0 30px rgba(0,232,122,0.25)",
        "glow-green-sm": "0 0 15px rgba(0,232,122,0.15)",
        "glow-gold":     "0 0 20px rgba(245,166,35,0.2)",
        card:            "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
      },
      borderRadius: {
        xl:   "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
