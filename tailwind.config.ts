import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'match-excellent': '#22c55e',
        'match-good': '#3b82f6',
        'match-fair': '#eab308',
        'match-low': '#f87171',
      },
    },
  },
  plugins: [],
};

export default config;
