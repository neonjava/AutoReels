import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../data');
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, 'autoreels.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function hasColumn(table: string, column: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return cols.some((c) => c.name === column);
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'submitter')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS platform_accounts (
      platform TEXT PRIMARY KEY CHECK(platform IN ('instagram', 'tiktok', 'youtube')),
      username TEXT,
      connected INTEGER NOT NULL DEFAULT 0,
      credentials_enc TEXT,
      last_upload_at TEXT,
      last_status TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS upload_jobs (
      id TEXT PRIMARY KEY,
      source_url TEXT NOT NULL,
      title TEXT,
      description TEXT,
      caption TEXT NOT NULL,
      video_path TEXT,
      created_by INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS platform_uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      progress INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      remote_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (job_id) REFERENCES upload_jobs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON upload_jobs(created_by);
    CREATE INDEX IF NOT EXISTS idx_platform_uploads_job ON platform_uploads(job_id);
  `);

  if (!hasColumn('upload_jobs', 'scheduled_for')) {
    db.exec(`ALTER TABLE upload_jobs ADD COLUMN scheduled_for TEXT`);
  }
  if (!hasColumn('upload_jobs', 'platforms_json')) {
    db.exec(`ALTER TABLE upload_jobs ADD COLUMN platforms_json TEXT`);
  }

  const platforms = ['instagram', 'tiktok', 'youtube'] as const;
  const insertPlatform = db.prepare(
    `INSERT OR IGNORE INTO platform_accounts (platform, connected) VALUES (?, 0)`
  );
  for (const p of platforms) insertPlatform.run(p);

  const defaults: Record<string, string> = {
    default_hashtags: '#drdonut\n#donutsmp\n#dream\n#viral\n#minecraft',
    download_location: './downloads',
    auto_delete_videos: 'false',
    theme: 'dark',
    upload_quality: 'high',
    retry_count: '3',
    default_platforms: 'instagram,tiktok,youtube',
    demo_mode: process.env.DEMO_MODE ?? 'true',
    // Delay every URL upload by 6 hours before publishing to platforms
    upload_delay_hours: '6',
    // Instagram Reel privacy-ish options
    ig_hide_like_counts: 'true',
    ig_disable_remix: 'true',
    ig_share_to_feed: 'true',
  };

  const insertSetting = db.prepare(
    `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`
  );
  for (const [key, value] of Object.entries(defaults)) {
    insertSetting.run(key, value);
  }
}
