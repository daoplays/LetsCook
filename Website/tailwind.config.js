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
            backgroundImage: {
                "custom-gradient": " linear-gradient(0deg, rgba(254,106,0,1) 0%, rgba(236,35,0,1) 100%)",
                "background-index": "linear-gradient(180deg, rgba(22,22,22,.8) 0%, rgba(236,35,0,.8) 100%)",
                "background-image": " url(/images/letscooksidenavbg.png)",
            },
            colors: {
                navigation: "#4e150a",
                buttonPrimary: "#F9DC81",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};
