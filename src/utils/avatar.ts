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

  // Single word: take first 1 or 2 graphemes
  const chars = Array.from(trimmed);
  return chars.slice(0, 2).join('').toUpperCase();
}

/**
 * Returns deterministic avatar color class or styles based on name hash.
 */
export function getAvatarColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 8;
}
