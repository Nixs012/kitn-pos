import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "brand-green": "var(--brand-green)",
        "brand-blue": "var(--brand-blue)",
        "brand-purple": "var(--brand-purple)",
        "brand-coral": "var(--brand-coral)",
        "brand-dark": "var(--brand-dark)",
        "brand-bg": "var(--brand-bg)",
      },
    },
  },
  plugins: [],
};
export default config;
