import { describe, expect, test } from 'vitest';
import { tokens } from './tokens';
function luminance(hex: string): number {
  const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(a: string, b: string) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
describe('normal-text color contrast', () => {
  for (const mode of ['light', 'dark'] as const) {
    test(`${mode} labels and balance states meet WCAG AA contrast`, () => {
      const c = tokens.colors[mode];
      const pairs = [
        [c.text, c.background], [c.text, c.surface], [c.muted, c.background], [c.muted, c.surface],
        [c.onPrimary, c.primary], [c.onDanger, c.danger], [c.owed, c.surface],
        [c.payable, c.surface], [c.owed, c.owedSoft], [c.payable, c.payableSoft],
        [c.primary, c.primarySoft], [c.muted, c.surfaceMuted],
      ];
      for (const [foreground, background] of pairs) expect(contrast(foreground, background), `${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5);
    });
    test(`${mode} essential control borders meet non-text contrast`, () => {
      const c = tokens.colors[mode];
      for (const fill of [c.surface, c.background, c.surfaceMuted]) expect(contrast(c.border, fill)).toBeGreaterThanOrEqual(3);
    });
  }
});
