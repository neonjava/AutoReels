import fs from 'node:fs';
import type { Server as SocketServer } from 'socket.io';
import { db } from '../database/index.js';
import { getSetting } from '../utils/settings.js';
import { uploadToPlatforms } from './upload/index.js';
import type { PlatformId } from './upload/types.js';

let timer: NodeJS.Timeout | null = null;
let running = false;

export function startScheduler(io: SocketServer) {
  if (timer) return;
  console.log('Upload scheduler started (checks every 30s)');
  timer = setInterval(() => {
    void tick(io);
  }, 30_000);
  void tick(io);
}

async function tick(io: SocketServer) {
  if (running) return;
  running = true;
  try {
    const due = db
      .prepare(
        `SELECT id, platforms_json, video_path
         FROM upload_jobs
         WHERE status = 'scheduled'
           AND scheduled_for IS NOT NULL
           AND datetime(scheduled_for) <= datetime('now')
         ORDER BY scheduled_for ASC
         LIMIT 5`
      )
      .all() as Array<{
      id: string;
      platforms_json: string | null;
      video_path: string | null;
    }>;

    for (const job of due) {
      const platforms = parsePlatforms(job.platforms_json);
      if (!platforms.length) {
        db.prepare(
          `UPDATE upload_jobs SET status = 'failed', updated_at = datetime('now') WHERE id = ?`
        ).run(job.id);
        continue;
      }

      db.prepare(
        `UPDATE platform_uploads SET status = 'pending', progress = 0, updated_at = datetime('now')
         WHERE job_id = ?`
      ).run(job.id);

      io.emit('upload:progress', {
        jobId: job.id,
        platform: platforms[0],
        status: 'uploading',
        progress: 0,
      });
      io.emit('job:scheduled_start', { jobId: job.id });

      await uploadToPlatforms(job.id, platforms, io).finally(() => {
        if (
          getSetting('auto_delete_videos', 'false') === 'true' &&
          job.video_path
        ) {
          try {
            fs.unlinkSync(job.video_path);
          } catch {
            /* ignore */
          }
        }
      });
    }
  } catch (err) {
    console.error('Scheduler tick failed', err);
  } finally {
    running = false;
  }
}

function parsePlatforms(raw: string | null): PlatformId[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return parsed.filter((p): p is PlatformId =>
      ['instagram', 'tiktok', 'youtube'].includes(p)
    );
  } catch {
    return [];
  }
}

export function getUploadDelayHours(): number {
  const n = Number(getSetting('upload_delay_hours', '6'));
  return Number.isFinite(n) && n >= 0 ? n : 6;
}

/** SQLite-friendly UTC datetime string: YYYY-MM-DD HH:MM:SS */
export function scheduledForFromNow(hours: number): string {
  const d = new Date(Date.now() + hours * 60 * 60 * 1000);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}
