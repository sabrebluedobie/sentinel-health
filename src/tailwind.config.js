/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:"#eff6ff",100:"#dbeafe",200:"#bfdbfe",300:"#93c5fd",
          400:"#60a5fa",500:"#3b82f6",600:"#2563eb",700:"#1d4ed8",
          800:"#1e40af",900:"#1e3a8a"
        }
      },
      boxShadow: {
        card: "0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      },
      borderRadius: {
        card: "16px"
      }
    },
  },
  plugins: [],
}