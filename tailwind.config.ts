import type { Config } from 'tailwindcss'

// Tokens de la sección 9 del PRD
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0D0D0D', deep: '#050505' },
        surface: { DEFAULT: '#111111', raised: '#141414', muted: '#1A1A1A' },
        line: { DEFAULT: '#262626', strong: '#333333' },
        ink: { DEFAULT: '#F4F4F4', soft: '#D4D4D4', muted: '#A3A3A3', faint: '#737373', off: '#525252' },
        brand: { DEFAULT: '#FF6F20', light: '#FF9D38' },
        sem: { red: '#EF4444', amber: '#F59E0B', green: '#22C55E' },
      },
      fontFamily: { sans: ['var(--font-inter)', 'Inter', 'Arial', 'sans-serif'] },
      borderRadius: { card: '24px', box: '16px', field: '12px' },
      boxShadow: { glow: '0 0 24px rgba(255,111,32,0.5)' },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg,#FF6F20 0%,#FF9D38 100%)',
        'radial-accent': 'radial-gradient(circle at 100% 0%, rgba(255,111,32,0.20), transparent 60%)',
      },
    },
  },
  plugins: [],
}
export default config
