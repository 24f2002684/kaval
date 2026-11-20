/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B1D2B',
          800: '#10273B',
          700: '#173652',
          600: '#1E476B',
        },
        teal: {
          deep: '#117C72',
          DEFAULT: '#117C72',
          bright: '#16C7B1',
          light: '#E6FAF7',
        },
        amber: {
          warning: '#FFB020',
          light: '#FFF8EB',
        },
        red: {
          danger: '#E5484D',
          light: '#FDF2F2',
        },
        slate: {
          canvas: '#F1F5F9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
