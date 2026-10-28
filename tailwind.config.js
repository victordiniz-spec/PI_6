/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],

  presets: [require("nativewind/preset")],

  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EEF7FC",
          100: "#D9EEF8",
          500: "#00AFCB",
          600: "#009BB5",
        },

        navy: {
          500: "#214B73",
          600: "#1B4268",
          700: "#173A5C",
          800: "#12314E",
        },

        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",

        surface: "#FFFFFF",
        background: "#D3DCE6",
      },

      borderRadius: {
        card: "20px",
        button: "12px",
        input: "12px",
      },
    },
  },

  plugins: [],
};
