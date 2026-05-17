module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050505",
        surface: "#0a0a0a",
        primary: "#3ecf8e",
        secondary: "#2a9d6a",
        accent: "#4cc9f0",
        danger: "#ef476f",
        warning: "#f4a261",
        border: "#1a1a1a",
      },
    },
  },
  plugins: [],
};
