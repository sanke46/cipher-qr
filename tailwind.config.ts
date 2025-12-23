import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#121212',
        card: '#1D2023',
        foreground: '#FAFAFA',
        muted: '#969FA8',
        accent: '#3E81F3',
        'accent-light': '#0097FD',
        'gradient-start': '#6DA3FF',
        'gradient-end': '#1C68EA',
        error: '#FA8A64',
        success: '#4CAF50',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}
export default config
