import { db } from '../database/index.js';

export function getSetting(key: string, fallback = ''): string {
  const row = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? fallback;
}

export function setSetting(key: string, value: string) {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, value);
}

export function getAllSettings(): Record<string, string> {
  const rows = db.prepare(`SELECT key, value FROM settings`).all() as Array<{
    key: string;
    value: string;
  }>;
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function getDefaultHashtags(): string {
  return getSetting(
    'default_hashtags',
    '#drdonut\n#donutsmp\n#dream\n#viral\n#minecraft'
  );
}

export function isDemoMode(): boolean {
  return getSetting('demo_mode', 'true') === 'true';
}
