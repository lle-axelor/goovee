const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    'app/**/*.{ts,tsx}',
    'ui/**/*.{ts,tsx}',
    'lib/core/comments/ui/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          light: 'hsl(var(--destructive-light))',
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          dark: 'hsl(var(--destructive-dark))',
        },
        success: {
          light: 'hsl(var(--success-light))',
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          dark: 'hsl(var(--success-dark))',
          light: 'hsl(var(--success-light))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        gray: {
          DEFAULT: 'hsl(var(--gray))',
          light: 'hsl(var(--gray-light))',
          dark: 'hsl(var(--gray-dark))',
          fog: 'hsl(var(--gray-fog))',
        },
        palette: {
          purple: {
            DEFAULT: 'hsl(var(--palette-purple))',
            light: 'hsl(var(--palette-purple-light))',
            dark: 'hsl(var(--palette-purple-dark))',
          },
          blue: {
            DEFAULT: 'hsl(var(--palette-blue))',
            light: 'hsl(var(--palette-blue-light))',
            dark: 'hsl(var(--palette-blue-dark))',
          },
          yellow: {
            DEFAULT: 'hsl(var(--palette-yellow))',
            light: 'hsl(var(--palette-yellow-light))',
            dark: 'hsl(var(--palette-yellow-dark))',
          },
          orange: {
            DEFAULT: 'hsl(var(--palette-orange))',
            light: 'hsl(var(--palette-orange-light))',
            dark: 'hsl(var(--palette-orange-dark))',
          },
          pink: {
            DEFAULT: 'hsl(var(--palette-pink))',
            light: 'hsl(var(--palette-pink-light))',
            dark: 'hsl(var(--palette-pink-dark))',
          },
          indigo: {
            DEFAULT: 'hsl(var(--palette-indigo))',
            light: 'hsl(var(--palette-indigo-light))',
            dark: 'hsl(var(--palette-indigo-dark))',
          },
          red: {
            DEFAULT: 'hsl(var(--palette-red))',
            light: 'hsl(var(--palette-red-light))',
            dark: 'hsl(var(--palette-red-dark))',
          },
          lightblue: {
            DEFAULT: 'hsl(var(--palette-lightblue))',
            light: 'hsl(var(--palette-lightblue-light))',
            dark: 'hsl(var(--palette-lightblue-dark))',
          },
          cyan: {
            DEFAULT: 'hsl(var(--palette-cyan))',
            light: 'hsl(var(--palette-cyan-light))',
            dark: 'hsl(var(--palette-cyan-dark))',
          },
          teal: {
            DEFAULT: 'hsl(var(--palette-teal))',
            light: 'hsl(var(--palette-teal-light))',
            dark: 'hsl(var(--palette-teal-dark))',
          },
          green: {
            DEFAULT: 'hsl(var(--palette-green))',
            light: 'hsl(var(--palette-green-light))',
            dark: 'hsl(var(--palette-green-dark))',
          },
          lightgreen: {
            DEFAULT: 'hsl(var(--palette-lightgreen))',
            light: 'hsl(var(--palette-lightgreen-light))',
            dark: 'hsl(var(--palette-lightgreen-dark))',
          },
          lime: {
            DEFAULT: 'hsl(var(--palette-lime))',
            light: 'hsl(var(--palette-lime-light))',
            dark: 'hsl(var(--palette-lime-dark))',
          },
          amber: {
            DEFAULT: 'hsl(var(--palette-amber))',
            light: 'hsl(var(--palette-amber-light))',
            dark: 'hsl(var(--palette-amber-dark))',
          },
          deeporange: {
            DEFAULT: 'hsl(var(--palette-deeporange))',
            light: 'hsl(var(--palette-deeporange-light))',
            dark: 'hsl(var(--palette-deeporange-dark))',
          },
          brown: {
            DEFAULT: 'hsl(var(--palette-brown))',
            light: 'hsl(var(--palette-brown-light))',
            dark: 'hsl(var(--palette-brown-dark))',
          },
          grey: {
            DEFAULT: 'hsl(var(--palette-grey))',
            light: 'hsl(var(--palette-grey-light))',
            dark: 'hsl(var(--palette-grey-dark))',
          },
          bluegrey: {
            DEFAULT: 'hsl(var(--palette-bluegrey))',
            light: 'hsl(var(--palette-bluegrey-light))',
            dark: 'hsl(var(--palette-bluegrey-dark))',
          },
          black: {
            DEFAULT: 'hsl(var(--palette-black))',
            light: 'hsl(var(--palette-black-light))',
            dark: 'hsl(var(--palette-black-dark))',
          },
          white: {
            DEFAULT: 'hsl(var(--palette-white))',
            light: 'hsl(var(--palette-white-light))',
            dark: 'hsl(var(--palette-white-dark))',
          },
          deeppurple: {
            DEFAULT: 'hsl(var(--palette-deeppurple))',
            light: 'hsl(var(--palette-deeppurple-light))',
            dark: 'hsl(var(--palette-deeppurple-dark))',
          },
        },
        // Goovee Orders redesign — additive raw-hex scales (CSS vars).
        mint: {
          50: 'var(--mint-50)',
          100: 'var(--mint-100)',
          200: 'var(--mint-200)',
          300: 'var(--mint-300)',
          400: 'var(--mint-400)',
          500: 'var(--mint-500)',
          600: 'var(--mint-600)',
          700: 'var(--mint-700)',
          800: 'var(--mint-800)',
          900: 'var(--mint-900)',
        },
        ink: {
          0: 'var(--ink-0)',
          25: 'var(--ink-25)',
          50: 'var(--ink-50)',
          100: 'var(--ink-100)',
          150: 'var(--ink-150)',
          200: 'var(--ink-200)',
          300: 'var(--ink-300)',
          400: 'var(--ink-400)',
          500: 'var(--ink-500)',
          600: 'var(--ink-600)',
          700: 'var(--ink-700)',
          800: 'var(--ink-800)',
          900: 'var(--ink-900)',
        },
        status: {
          pending: {
            bg: 'var(--status-pending-bg)',
            fg: 'var(--status-pending-fg)',
            dot: 'var(--status-pending-dot)',
          },
          confirmed: {
            bg: 'var(--status-confirmed-bg)',
            fg: 'var(--status-confirmed-fg)',
            dot: 'var(--status-confirmed-dot)',
          },
          shipped: {
            bg: 'var(--status-shipped-bg)',
            fg: 'var(--status-shipped-fg)',
            dot: 'var(--status-shipped-dot)',
          },
          delivered: {
            bg: 'var(--status-delivered-bg)',
            fg: 'var(--status-delivered-fg)',
            dot: 'var(--status-delivered-dot)',
          },
          cancelled: {
            bg: 'var(--status-cancelled-bg)',
            fg: 'var(--status-cancelled-fg)',
            dot: 'var(--status-cancelled-dot)',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
        jakarta: [
          'var(--font-jakarta)',
          '"Plus Jakarta Sans"',
          '"Inter"',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  safelist: [
    ...[
      'indigo',
      'red',
      'blue',
      'lightblue',
      'cyan',
      'teal',
      'pink',
      'green',
      'lightgreen',
      'lime',
      'yellow',
      'amber',
      'orange',
      'deeporange',
      'brown',
      'grey',
      'bluegrey',
      'black',
      'white',
      'purple',
      'deeppurple',
    ].flatMap(color => [
      `bg-palette-${color}`,
      `!bg-palette-${color}`,
      `bg-palette-${color}-light`,
      `!bg-palette-${color}-light`,
      `bg-palette-${color}-dark`,
      `!bg-palette-${color}-dark`,
      `hover:bg-palette-${color}-light`,
      `!hover:bg-palette-${color}-light`,
      `hover:bg-palette-${color}-dark`,
      `!hover:bg-palette-${color}-dark`,
      `text-palette-${color}`,
      `!text-palette-${color}`,
      `hover:text-palette-${color}-light`,
      `!hover:text-palette-${color}-light`,
    ]),
  ],
  plugins: [require('tailwindcss-animate')],
};
