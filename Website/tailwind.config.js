/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["selector", '[data-mode="dark"]', "class"],
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        // Or if using `src` directory:
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            borderRadius: {},
            colors: {},
        },
    },
    plugins: [require("tailwindcss-animate")],
};
