import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1020",
        line: "#e6e9f0",
        mist: "#f7f8fb"
      },
      boxShadow: {
        premium: "0 24px 80px rgba(15, 23, 42, 0.12)",
        soft: "0 14px 40px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
