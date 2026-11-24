/** Single source for Flutter ThemeData handoff. CSS consumes these as variables. */
export const tokens = {
  colors: {
    light: {
      canvas: '#f5f5f5', background: '#ffffff', surface: '#ffffff', surfaceMuted: '#f5f5f5',
      text: '#171717', muted: '#525252', border: '#737373', borderSubtle: '#e5e5e5', primary: '#086b57',
      overlay: '#00000066', danger: '#b32624', onDanger: '#ffffff', primaryHover: '#055442', onPrimary: '#ffffff', primarySoft: '#e6f4f0',
      owed: '#b32624', owedSoft: '#fcece9', payable: '#256a3b', payableSoft: '#e7f3e8',
      focus: '#086b57', heroDecoration: '#00000000', frame: '#262626', frameInner: '#171717',
    },
    dark: {
      canvas: '#0a0a0a', background: '#121212', surface: '#1a1a1a', surfaceMuted: '#262626',
      text: '#f5f5f5', muted: '#b0b0b0', border: '#8c8c8c', borderSubtle: '#262626', primary: '#9bd6b6',
      overlay: '#00000099', danger: '#ffb4ab', onDanger: '#601410', primaryHover: '#b5e6cb', onPrimary: '#093e2e', primarySoft: '#254c3b',
      owed: '#ffb4ab', owedSoft: '#4e302c', payable: '#a5d6a7', payableSoft: '#264632',
      focus: '#9bd6b6', heroDecoration: '#00000000', frame: '#404040', frameInner: '#121212',
    },
  },
  typography: {
    fontEnglish: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontUrdu: "'Noto Nastaliq Urdu', 'Noto Naskh Arabic', 'Inter', serif",
    fontContent: "'Inter', 'Noto Nastaliq Urdu', 'Noto Naskh Arabic', sans-serif",
    sizeInput: '16px', sizeXs: '12px', sizeSm: '14px', sizeBody: '16px', sizeLabel: '14px', sizeTitle: '20px',
    sizeHeading: '24px', sizeDisplay: '32px', sizePreviewTitle: '28px',
    lineBody: '1.5', lineUrdu: '2.2', lineTitle: '1.25',
    weightRegular: '400', weightMedium: '500', weightSemibold: '600', weightBold: '700',
    trackingLabel: '0.04em', trackingTitle: '-0.02em',
  },
  spacing: { s0: '0px', s1: '4px', s2: '8px', s3: '12px', s4: '16px', s5: '20px', s6: '24px', s7: '28px', s8: '32px', s10: '40px', s12: '48px', s16: '64px' },
  radius: { small: '6px', control: '8px', card: '12px', hero: '12px', phone: '40px', screen: '32px', pill: '999px', sheet: '16px' },
  layout: { phoneWidth: '402px', phoneMaxWidth: '430px', phoneHeight: '824px', desktopBreakpoint: '640px',
    pageMaxWidth: '960px', controlHeight: '56px', touchTarget: '48px', iconSize: '20px', iconSmall: '16px',
    brandSize: '40px', illustrationSize: '80px', frameBorder: '6px', borderWidth: '1px', focusWidth: '2px',
    heroRing: '0px', heroRingInset: '0px', progressWidth: '24px', progressHeight: '2px', modalWidth: '390px', modalMaxHeight: '88dvh', identityMinWidth: '128px', modalViewportGap: '24px', stickyOffset: '0px', customerRowEstimate: '72px' },
  motion: { fast: '150ms', normal: '200ms', easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  shadows: { phone: '0 12px 32px rgba(0, 0, 0, 0.08)', floating: 'none', card: 'none', sheet: '0 -4px 20px rgba(0, 0, 0, 0.1)' },
} as const;

function kebab(key: string) { return key.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`); }
export function themeVariables(darkMode: boolean): Record<string, string> {
  const values: Record<string, string> = {};
  const groups = { color: tokens.colors[darkMode ? 'dark' : 'light'], type: tokens.typography,
    space: tokens.spacing, radius: tokens.radius, layout: tokens.layout, motion: tokens.motion, shadow: tokens.shadows };
  for (const [group, entries] of Object.entries(groups)) {
    for (const [key, value] of Object.entries(entries)) values[`--${group}-${kebab(key)}`] = value;
  }
  return values;
}
