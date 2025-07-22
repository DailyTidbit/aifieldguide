/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': '#60A875',
        'brand-blue': '#59B1E3',
      },
      fontFamily: {
        'playfair': ['Playfair Display', 'serif'],
        'space-grotesk': ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  // Enable @apply for Tailwind v4
  experimental: {
    optimizeUniversalDefaults: true,
  },
  // This is specifically for v4 @apply support
  plugins: [],
};