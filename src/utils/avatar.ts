/**
 * Extracts initials from a customer name (supports English and Urdu/Arabic).
 */
export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = Array.from(parts[0])[0];
    const second = Array.from(parts[1])[0];
    return (first + second).toUpperCase();
  }

  const chars = Array.from(trimmed);
  return chars.slice(0, 2).join('').toUpperCase();
}

export interface AvatarColors {
  bg: string;
  fg: string;
}

const LIGHT_AVATAR_PALETTES: AvatarColors[] = [
  { bg: '#D7F0E6', fg: '#0B4F3F' },
  { bg: '#DCE8FB', fg: '#1E3A8A' },
  { bg: '#FFF1C2', fg: '#7A5200' },
  { bg: '#F3DDF5', fg: '#6B21A8' },
  { bg: '#FAD9DE', fg: '#9F1239' },
  { bg: '#DDF3F5', fg: '#155E75' },
  { bg: '#E4EEDB', fg: '#2F5219' },
  { bg: '#FDE6D2', fg: '#9A3412' },
];

const DARK_AVATAR_PALETTES: AvatarColors[] = [
  { bg: '#163D32', fg: '#A7F3D0' },
  { bg: '#1B315E', fg: '#BFDBFE' },
  { bg: '#3F2F10', fg: '#FDE68A' },
  { bg: '#3B1D52', fg: '#E9D5FF' },
  { bg: '#4C1725', fg: '#FECDD3' },
  { bg: '#133A47', fg: '#A5F3FC' },
  { bg: '#223B17', fg: '#D9F99D' },
  { bg: '#4A2411', fg: '#FED7AA' },
];

/**
 * Returns deterministic avatar color index based on name hash.
 */
export function getAvatarColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 8;
}

export function getAvatarPalette(name: string, darkMode = false): AvatarColors {
  const idx = getAvatarColorIndex(name);
  return (darkMode ? DARK_AVATAR_PALETTES : LIGHT_AVATAR_PALETTES)[idx];
}
