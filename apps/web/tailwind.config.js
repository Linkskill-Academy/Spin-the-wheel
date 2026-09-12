/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FFFFFF',
        softbg: '#F7FAF8',
        primary: {
          DEFAULT: '#16A34A',
          dark: '#166534',
          light: '#DCFCE7',
        },
        ink: '#111827',
        muted: '#6B7280',
        line: '#E5E7EB',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
