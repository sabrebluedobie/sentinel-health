/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  // No need to duplicate colors here when using @theme in CSS
  theme: { extend: {} },
  plugins: [],
};
