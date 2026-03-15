import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          1: '#0F172A',
          2: '#1E293B',
          3: '#334155',
          4: '#475569',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#CBD5E1',
          tertiary: '#94A3B8',
          inverse: '#0F172A',
        },
        accent: {
          primary: '#10B981',
          hover: '#059669',
          light: '#ECFDF5',
          border: '#A7F3D0',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      fontSize: {
        'body-sm': ['12px', '18px'],
        'body-reg': ['14px', '22px'],
        'body-lg': ['16px', '24px'],
        'h1': ['32px', '40px'],
        'h2': ['24px', '32px'],
        'h3': ['20px', '28px'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.08)',
        md: '0 4px 6px rgba(0,0,0,0.12)',
        lg: '0 10px 25px rgba(0,0,0,0.15)',
        xl: '0 20px 40px rgba(0,0,0,0.2)',
        focus: '0 0 0 3px rgba(16,185,129,0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-in': 'bounceIn 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'spin-slow': 'spin 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.3))' },
          '50%': { opacity: '0.8', filter: 'drop-shadow(0 0 12px rgba(16,185,129,0.7))' },
        },
      },
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '400ms',
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

export default config;

