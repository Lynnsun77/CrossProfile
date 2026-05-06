import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'market': '#2A6DF4',
        'foundry': '#7B5BF5',
        'dashboard': '#1F8A70',
        'bg': '#F7F9FC',
        'surface': '#FFFFFF',
        'border': '#E5E8F0',
        'text-1': '#0B1220',
        'text-2': '#4B5565',
        'text-3': '#8A94A6',
        'brand-500': '#5B7CFA',
        'brand-soft': 'rgba(91,124,250,0.08)',
        'module-market': '#4E7BFF',
        'module-workshop': '#8B5CF6',
        'module-dashboard': '#10B981',
        'asset-crowd': '#4E7BFF',
        'asset-tag': '#06B6D4',
        'asset-feature': '#8B5CF6',
        'semantic-good': '#10B981',
        'semantic-bad': '#EF4444',
        'semantic-neutral': '#8A94A6',
      },
      fontSize: {
        'xs': '12px',
        'sm': '13px',
        'base': '14px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '28px',
        '3xl': '36px',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
      },
      borderRadius: {
        'chip': '6px',
        'card': '10px',
        'ai': '14px',
      },
      boxShadow: {
        'glow-ai': '0 0 0 1px rgba(139,92,246,.25), 0 0 12px rgba(78,123,255,.18)',
        'glow-kpi': '0 0 0 1px rgba(78,123,255,.18), 0 6px 20px rgba(78,123,255,.08)',
        'card-hover': '0 8px 24px rgba(0,0,0,.08)',
      },
      transitionTimingFunction: {
        'platform': 'cubic-bezier(.2,.8,.2,1)',
      },
      transitionDuration: {
        'platform': '150ms',
      }
    },
  },
  plugins: [],
} satisfies Config
