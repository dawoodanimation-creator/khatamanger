import type { Config } from 'tailwindcss';
import { tokens } from './src/theme/tokens';
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { screens: { sm: tokens.layout.desktopBreakpoint }, spacing: { 0: tokens.spacing.s0, 2: tokens.spacing.s2, 3: tokens.spacing.s3 }, extend: {} },
  plugins: [],
} satisfies Config;
