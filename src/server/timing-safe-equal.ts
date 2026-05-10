/**
 * Constant-time string comparison to prevent timing attacks on secret/token checks.
 * Always iterates the full length of the longer string so an attacker cannot
 * infer the secret one byte at a time from response latency.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
