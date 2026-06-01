/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Sora", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontWeight: {
        400: "400",
        500: "500",
        600: "600",
        700: "700",
        800: "800",
        900: "900",
      },
      colors: {
        ink: {
          950: "#07070b",
          900: "#0a0a12",
          850: "#0f0f1a",
          800: "#13131f",
          700: "#1b1b2b",
        },
        brand: {
          50: "#eafff5",
          100: "#c8ffe7",
          200: "#94fdd1",
          300: "#54f3b8",
          400: "#1fe39d",
          500: "#00c884",
          600: "#00a06c",
          700: "#057a55",
          800: "#0a6045",
          900: "#0b4f3a",
        },
        gold: {
          300: "#ffe08a",
          400: "#ffcf4d",
          500: "#f5b71b",
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.45)",
        glow: "0 0 40px -10px rgba(31, 227, 157, 0.45)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.4s ease both",
        "scale-in": "scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
