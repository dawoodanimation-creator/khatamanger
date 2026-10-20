/** Single source for Flutter ThemeData handoff. CSS consumes these as variables. */
export const tokens = {
  colors: {
    light: {
      canvas: '#e9eee9', background: '#fafbf8', surface: '#ffffff', surfaceMuted: '#f0f4ef',
      text: '#19392f', muted: '#52665c', border: '#76877c', primary: '#086b57',
      overlay: '#102a23a6', danger: '#b32624', onDanger: '#ffffff', primaryHover: '#055442', onPrimary: '#ffffff', primarySoft: '#e2efe7',
      owed: '#b32624', owedSoft: '#fcece9', payable: '#256a3b', payableSoft: '#e7f3e8',
      focus: '#438e77', heroDecoration: '#ffffff12', frame: '#34483e', frameInner: '#182b23',
    },
    dark: {
      canvas: '#101b17', background: '#17251f', surface: '#1e3028', surfaceMuted: '#263b31',
      text: '#edf3e9', muted: '#b0c2b5', border: '#80998a', primary: '#9bd6b6',
      overlay: '#050d09bd', danger: '#ffb4ab', onDanger: '#601410', primaryHover: '#b5e6cb', onPrimary: '#093e2e', primarySoft: '#254c3b',
      owed: '#ffb4ab', owedSoft: '#4e302c', payable: '#a5d6a7', payableSoft: '#264632',
      focus: '#b4e5cd', heroDecoration: '#ffffff10', frame: '#43574b', frameInner: '#0b1711',
    },
  },
  typography: {
    fontEnglish: "'Inter', system-ui, sans-serif",
    fontUrdu: "'Noto Nastaliq Urdu', 'Inter', serif",
    fontContent: "'Inter', 'Noto Nastaliq Urdu', sans-serif",
    sizeInput: '16px', sizeXs: '12px', sizeSm: '14px', sizeBody: '15px', sizeLabel: '14px', sizeTitle: '20px',
    sizeHeading: '24px', sizeDisplay: '36px', sizePreviewTitle: '32px',
    lineBody: '1.6', lineUrdu: '2.35', lineTitle: '1.3',
    weightRegular: '400', weightMedium: '500', weightSemibold: '600', weightBold: '700',
    trackingLabel: '0.12em', trackingTitle: '-0.035em',
  },
  spacing: { s0: '0px', s1: '4px', s2: '8px', s3: '12px', s4: '16px', s5: '20px', s6: '24px', s7: '28px', s8: '32px', s10: '40px', s12: '48px', s16: '64px' },
  radius: { small: '10px', control: '14px', card: '20px', hero: '24px', phone: '44px', screen: '36px', pill: '999px' },
  layout: { phoneWidth: '402px', phoneMaxWidth: '430px', phoneHeight: '824px', desktopBreakpoint: '640px',
    pageMaxWidth: '960px', controlHeight: '56px', touchTarget: '48px', iconSize: '21px', iconSmall: '17px',
    brandSize: '44px', illustrationSize: '104px', frameBorder: '7px', borderWidth: '1px', focusWidth: '3px',
    heroRing: '180px', heroRingInset: '-56px', progressWidth: '26px', progressHeight: '3px', modalWidth: '390px', modalMaxHeight: '88dvh', identityMinWidth: '128px', modalViewportGap: '32px', stickyOffset: '0px', customerRowEstimate: '94px' },
  motion: { fast: '160ms', normal: '240ms', easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  shadows: { phone: '0 24px 64px #15342622, 0 6px 16px #15342618', floating: '0 8px 24px #086b5726', card: '0 2px 8px #15342604' },
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
