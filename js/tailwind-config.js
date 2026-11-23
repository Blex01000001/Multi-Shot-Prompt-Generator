// Tailwind Play CDN configuration (must load right after cdn.tailwindcss.com)
// Colors that change with the theme are CSS variables defined in css/style.css.
const themeColors = {};
['slate', 'indigo', 'purple', 'pink', 'rose', 'amber', 'emerald'].forEach(name => {
  themeColors[name] = {};
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].forEach(step => {
    themeColors[name][step] = `rgb(var(--${name}-${step}) / <alpha-value>)`;
  });
});

tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '"Noto Sans TC"', '"Noto Sans JP"', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        ...themeColors,
        brand: {
          50: '#f0f3ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        }
      }
    }
  }
}
