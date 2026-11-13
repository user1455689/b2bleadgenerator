import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9ecff",
          200: "#bcddff",
          300: "#8ec6ff",
          400: "#59a3ff",
          500: "#327dfc",
          600: "#1e5df1",
          700: "#1747dd",
          800: "#183ab3",
          900: "#19358d",
          950: "#132256",
        },
      },
    },
  },
  plugins: [],
};

export default config;

