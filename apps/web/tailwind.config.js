const path = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./apps/web/src/**/*.{js,ts,jsx,tsx,mdx}",
    path.join(__dirname, "src/**/*.{js,ts,jsx,tsx,mdx}").replace(/\\/g, "/"),
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};


