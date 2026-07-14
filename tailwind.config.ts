import type { Config } from 'tailwindcss';

/**
 * Design tokens extracted from dogsanook.com / the /mommam demo page:
 * warm espresso background, golden-amber primary, fresh green logo accent,
 * blue "owner practiced" accent, and cream cards.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#221b16', // espresso base background
          bgSoft: '#2c231d', // elevated dark surface
          bgSofter: '#372c24', // hover / raised
          card: '#fbf6ec', // cream game card
          cream: '#fdf9f0',
          gold: '#ffcb05', // brand yellow (from the logo) — buttons, progress, numbers
          goldDark: '#e6b800',
          goldSoft: '#ffe9a3',
          teal: '#00848e', // brand teal (from the logo)
          tealDark: '#006b73',
          green: '#7cb342', // success / "allowed" status
          greenDark: '#5f9a34',
          blue: '#3b82f6', // owner "practiced" accent
          blueDark: '#2563eb',
          ink: '#2a2018', // text on cream cards
          muted: '#9c9088', // muted text on dark
          mutedInk: '#8a7f74', // muted text on cream
          line: '#06c755', // official LINE green
        },
      },
      fontFamily: {
        sans: ['Prompt', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '1.25rem',
      },
      boxShadow: {
        card: '0 8px 24px -12px rgba(0,0,0,0.35)',
        soft: '0 2px 8px -2px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
