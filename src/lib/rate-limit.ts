// In-memory login-attempt limiter. Scoped to this process, so it resets on
// restart and isn't shared across multiple server instances — acceptable
// for a single-instance deployment, not a substitute for an edge/proxy-level
// rate limit under real horizontal scaling.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

const attempts = new Map<string, { count: number; firstAttempt: number }>();

export function isRateLimited(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.firstAttempt > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(key: string): void {
  const entry = attempts.get(key);
  if (!entry || Date.now() - entry.firstAttempt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttempt: Date.now() });
  } else {
    entry.count += 1;
  }
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}
