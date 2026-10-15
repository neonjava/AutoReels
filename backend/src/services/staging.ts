import crypto from 'node:crypto';
import fs from 'node:fs';

type StageEntry = {
  filePath: string;
  expiresAt: number;
};

const store = new Map<string, StageEntry>();

/** Temporary public URLs Instagram (and similar) can fetch from this server. */
export function createStagingToken(
  filePath: string,
  ttlMs = 2 * 60 * 60 * 1000
): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Video file not found: ${filePath}`);
  }
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt < now) store.delete(key);
  }
  const token = crypto.randomBytes(24).toString('hex');
  store.set(token, { filePath, expiresAt: now + ttlMs });
  return token;
}

export function resolveStagingToken(token: string): string | null {
  const entry = store.get(token);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(token);
    return null;
  }
  return entry.filePath;
}

export function getPublicBaseUrl(): string {
  const fromEnv = (process.env.PUBLIC_BASE_URL ?? '').trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  const port = process.env.PORT ?? '4000';
  return `http://127.0.0.1:${port}`;
}

export function isPubliclyReachableBase(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname;
    return !(
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.endsWith('.local')
    );
  } catch {
    return false;
  }
}
