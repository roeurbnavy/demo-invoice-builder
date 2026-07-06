/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./imports/ui/**/*.{vue,js,ts,jsx,tsx}', './client/*.html'],
  theme: {
    extend: {
      colors: {
        workspace: 'var(--color-workspace)',
        'workspace-secondary': 'var(--color-workspace-secondary)',
        paper: 'var(--color-paper)',
        panel: 'var(--color-panel)',
        'panel-border': 'var(--color-panel-border)',
        'panel-text': 'var(--color-panel-text)',
        'panel-muted': 'var(--color-panel-muted)',
        'panel-hover': 'var(--color-panel-hover)',
        'panel-active': 'var(--color-panel-active)',
        'panel-hover-text': 'var(--color-panel-hover-text)',
        'input-bg': 'var(--color-input-bg)',
        'card-bg': 'var(--color-card-bg)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-dim': 'var(--color-accent-dim)',
        danger: 'var(--color-danger)',
        'danger-dim': 'var(--color-danger-dim)',
        success: 'var(--color-success)',
        'success-dim': 'var(--color-success-dim)',
        warning: 'var(--color-warning)',
        'warning-dim': 'var(--color-warning-dim)',
        selection: 'var(--color-selection)',
        guide: 'var(--color-guide)',
        'out-of-bounds': 'var(--color-out-of-bounds)',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans', 'sans-serif'],
        khmer: ['Noto Sans Khmer', 'Noto Sans', 'sans-serif'],
      },
      boxShadow: {
        paper: 'var(--shadow-paper)',
        panel: 'var(--shadow-panel)',
        'block-selected': 'var(--shadow-block-selected)',
        dropdown: 'var(--shadow-dropdown)',
      },
      transitionDuration: {
        fast: 'var(--transition-fast)',
        normal: 'var(--transition-normal)',
        slow: 'var(--transition-slow)',
      }
    },
  },
  plugins: [],
}
