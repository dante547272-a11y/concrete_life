/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Industrial dark theme colors
        'bg-primary': '#0a0e14',
        'bg-secondary': '#141a24',
        'bg-tertiary': '#1e2632',
        'status-running': '#00ff88',
        'status-stopped': '#ff4757',
        'status-warning': '#ffa502',
        'status-idle': '#3498db',
        'bin-fill': '#4a90d9',
        'bin-empty': '#2d3a4a',
        'pipe-color': '#5a6a7a',
        'text-accent': '#00d4ff',
        'border-color': '#2d3a4a',
      },
      screens: {
        // Custom breakpoints for industrial displays
        'tablet': '768px',
        'desktop': '1280px',
        'hd': '1920px',
        'uhd': '2560px',
        'control-panel': '1920px',
      },
      fontFamily: {
        'mono': ['Roboto Mono', 'monospace'],
        'industrial': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'alarm-blink': 'alarm-blink 0.5s infinite',
        'mixer-rotate': 'mixer-rotate 1s linear infinite',
        'material-flow': 'material-flow 0.5s linear infinite',
      },
      keyframes: {
        'alarm-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'mixer-rotate': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'material-flow': {
          '0%': { strokeDashoffset: '20' },
          '100%': { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
}
