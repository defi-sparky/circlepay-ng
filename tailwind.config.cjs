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
          bg: "#07090F",
          surface: "#0E1118",
          card: "#141820",
          border: "#1E2433",
          muted: "#252D3D",
          green: "#00E87A",
          "green-dim": "#00C468",
          gold: "#F5A623",
          blue: "#3D7EFF",
          text: "#E8EDF5",
          "text-muted": "#6B7A99",
        },
        arc: {
          primary: "#00E87A",
          secondary: "#3D7EFF",
          accent: "#F5A623",
        },
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      backgroundImage: {
        "glow-green": "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,232,122,0.12) 0%, transparent 70%)",
        "glow-blue": "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(61,126,255,0.10) 0%, transparent 70%)",
        "card-gradient": "linear-gradient(135deg, rgba(20,24,32,0.9) 0%, rgba(14,17,24,0.95) 100%)",
        "green-gradient": "linear-gradient(135deg, #00E87A 0%, #00C468 100%)",
        "gold-gradient": "linear-gradient(135deg, #F5A623 0%, #E8941A 100%)",
      },
      boxShadow: {
        "glow-green": "0 0 30px rgba(0,232,122,0.25)",
        "glow-green-sm": "0 0 15px rgba(0,232,122,0.15)",
        "glow-gold": "0 0 20px rgba(245,166,35,0.2)",
        card: "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
      },
      animation: {
        "pulse-green": "pulse-green 2s ease-in-out infinite",
        "slide-up": "slide-up 0.4s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        "pulse-green": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "slide-up": {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
