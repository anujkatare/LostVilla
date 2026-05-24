/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Pinterest Design System Theme Colors (Light Cream Mode)
        canvas: {
          DEFAULT: '#ffffff',
          dark: '#0a0a0a'
        },
        surface: {
          soft: {
            DEFAULT: '#fbfbf9',
            dark: '#121212'
          },
          card: {
            DEFAULT: '#f6f6f3',
            dark: '#1a1a18'
          },
          dark: '#262622',
        },
        secondary: {
          bg: {
            DEFAULT: '#e5e5e0',
            dark: '#2e2e2b'
          },
          pressed: {
            DEFAULT: '#c8c8c1',
            dark: '#3e3e3b'
          }
        },
        primary: {
          DEFAULT: '#e60023', // Pinterest Red
          pressed: '#cc001f',
        },
        // Typography Colors
        ink: {
          DEFAULT: '#000000',
          soft: '#211922',
          dark: '#ffffff'
        },
        body: {
          DEFAULT: '#33332e',
          dark: '#d1d1ca'
        },
        charcoal: {
          DEFAULT: '#262622',
          dark: '#e5e5e0'
        },
        mute: {
          DEFAULT: '#62625b',
          dark: '#91918c'
        },
        ash: {
          DEFAULT: '#91918c',
          dark: '#62625b'
        },
        stone: {
          DEFAULT: '#c8c8c1',
          dark: '#3e3e3b'
        },
        hairline: {
          DEFAULT: '#dadad3',
          dark: '#2e2e2b'
        },
        'hairline-soft': {
          DEFAULT: '#e5e5e0',
          dark: '#2e2e2b'
        },
        // Semantic Colors
        error: {
          DEFAULT: '#9e0a0a',
          deep: '#cc001f'
        },
        success: {
          pale: '#c7f0da',
          deep: '#103c25'
        },
        focus: {
          outer: '#435ee5',
          inner: '#ffffff'
        }
      },
      borderRadius: {
        'none': '0px',
        'sm': '8px',
        'md': '16px', // Dominant radius in design system
        'lg': '32px', // Modals and large cards
        'full': '9999px' // Search bars, avatars, chips
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['Manrope', 'Inter', 'sans-serif']
      },
      letterSpacing: {
        tightest: '-1.2px',
        tighter: '-0.8px',
      },
      boxShadow: {
        'ambient': '0 16px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06)',
        'ambient-dark': '0 16px 32px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.3)'
      }
    },
  },
  plugins: [],
}
