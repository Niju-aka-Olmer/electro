// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // CSS переменные → Tailwind классы
        bg: {
          base:     'var(--bg-base)',
          surface:  'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
          subtle:   'var(--bg-subtle)',
        },
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
        },
        accent: {
          amber:  'var(--amber-400)',
          blue:   'var(--electric-blue)',
          danger: 'var(--danger-red)',
          earth:  'var(--earth-green)',
        },
        border: {
          DEFAULT: 'var(--border)',
          accent:  'var(--border-accent)',
        },
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        sans:    ['IBM Plex Sans', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'monospace'],
      },
      fontSize: {
        // Технические номиналы — крупным моно
        'rating': ['2.5rem', { fontWeight: '700', letterSpacing: '-0.02em' }],
      },
      backgroundImage: {
        // Сетка как на инженерном чертеже
        'grid-dark':  `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                       linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
        'grid-light': `linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
                       linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)`,
        // Amber glow gradient
        'amber-glow': 'radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.15) 0%, transparent 60%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'current-flow':   'currentFlow 2s linear infinite',
        'fade-in-up':     'fadeInUp 0.5s ease forwards',
        'glow-pulse':     'glowPulse 2s ease-in-out infinite',
        'slide-in-right': 'slideInRight 0.3s ease forwards',
      },
      keyframes: {
        currentFlow: {
          '0%':   { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(251,191,36,0.2)' },
          '50%':      { boxShadow: '0 0 40px rgba(251,191,36,0.4)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        'amber':     '0 0 30px rgba(251,191,36,0.2)',
        'amber-lg':  '0 0 60px rgba(251,191,36,0.3)',
        'electric':  '0 0 20px rgba(56,189,248,0.2)',
        'surface':   '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        'card':      '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -1px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
}

export default config
