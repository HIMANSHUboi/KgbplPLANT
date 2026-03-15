/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pf: {
          bg: '#ebf0f9',
          surface: '#ffffff',
          card: 'rgba(255, 255, 255, 0.65)',
          border: 'rgba(255, 255, 255, 0.8)',
          accent: '#5b60c4',
          green: '#10b981',
          amber: '#f59e0b',
          red: '#f43f5e',
          purple: '#8b5cf6',
          text: '#1e293b',
          muted: '#64748b',
          dim: '#94a3b8',
          'glass-edge': 'rgba(255, 255, 255, 0.6)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(-12px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        pulseGlow: { '0%, 100%': { boxShadow: '0 0 0 0 rgba(91, 96, 196, 0.2)' }, '50%': { boxShadow: '0 0 20px 4px rgba(91, 96, 196, 0.1)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(31, 38, 135, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        'glass-lg': '0 12px 48px rgba(31, 38, 135, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        'glass-sm': '0 4px 16px rgba(31, 38, 135, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
      },
    },
  },
  plugins: [],
};