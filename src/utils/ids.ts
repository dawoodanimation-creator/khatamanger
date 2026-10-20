/** Same 16 random bytes / 32 hex characters as Flutter newId(). */
export function newId(): string {
  return [...crypto.getRandomValues(new Uint8Array(16))].map(value => value.toString(16).padStart(2, '0')).join('');
}
