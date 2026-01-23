/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#C19A6B",     // light brown (navbar)
        primaryDark: "#A0784F", // hover
        background: "#FFFFFF", // white
        textMain: "#1F2937",    // dark gray
        textSoft: "#4B5563",    // soft gray
        accent: "#22C55E"       // green (CTA)
      }
    }
  },
  plugins: []
};
