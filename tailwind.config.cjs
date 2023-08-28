const defaultTheme = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');
const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
  ],
  theme: {
    extend: {
      minHeight: {
        32: '128px',
      },
      fontFamily: {
        sans: ['Lato', ...defaultTheme.fontFamily.sans],
        serif: ['Lora', ...defaultTheme.fontFamily.serif],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    plugin(function ({ addBase }) {
      addBase({
        body: {
          margin: '12px auto',
        },
        h1: {
          fontSize: defaultTheme.fontSize['6xl'],
          fontWeight: 'bold',
          marginBottom: defaultTheme.spacing['5'],
        },
        h2: {
          fontSize: defaultTheme.fontSize['4xl'],
          fontWeight: 'bold',
          marginBottom: defaultTheme.spacing['5'],
        },
        h3: {
          fontSize: defaultTheme.fontSize['2xl'],
          fontWeight: 'bold',
          marginBottom: defaultTheme.spacing['5'],
        },
        a: {
          color: colors.blue['500'],
          hover: {
            textDecoration: 'underline',
          },
        },
      });
    }),
  ],
};
