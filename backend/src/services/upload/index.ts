import { Server as SocketServer } from 'socket.io';
import { db } from '../../database/index.js';
import { getSetting } from '../../utils/settings.js';
import { InstagramProvider } from './instagram/index.js';
import { TikTokProvider } from './tiktok/index.js';
import { YouTubeProvider } from './youtube/index.js';
import type { PlatformId, PlatformProvider } from './types.js';

const providers: Record<PlatformId, PlatformProvider> = {
  instagram: new InstagramProvider('instagram', 'Instagram 1'),
  instagram2: new InstagramProvider('instagram2', 'Instagram 2'),
  tiktok: new TikTokProvider(),
  youtube: new YouTubeProvider(),
};

export function getProvider(id: PlatformId): PlatformProvider {
  return providers[id];
}

export function listProviders(): PlatformProvider[] {
  return Object.values(providers);
}

export function getRetryCount(): number {
  const retries = Number(getSetting('retry_count', '0'));
  return Number.isFinite(retries) ? Math.max(0, Math.min(3, retries)) : 0;
}

export async function uploadToPlatforms(
  jobId: string,
  platforms: PlatformId[],
  io?: SocketServer
) {
  const job = db
    .prepare(
      `SELECT id, video_path, caption, title FROM upload_jobs WHERE id = ?`
    )
    .get(jobId) as
    | { id: string; video_path: string; caption: string; title: string }
    | undefined;

  if (!job?.video_path) {
    throw new Error('Job or video not found');
  }

  db.prepare(
    `UPDATE upload_jobs SET status = 'uploading', updated_at = datetime('now') WHERE id = ?`
  ).run(jobId);

  const retries = getRetryCount();

  await Promise.all(
    platforms.map(async (platform) => {
      const provider = getProvider(platform);
      let attempt = 0;
      let lastError = '';

      while (attempt <= retries) {
        attempt += 1;
        try {
          updatePlatformUpload(jobId, platform, 'uploading', 0);
          emitProgress(io, jobId, platform, 'uploading', 0);

          const result = await provider.upload(
            {
              jobId,
              videoPath: job.video_path,
              caption: job.caption,
              title: job.title || 'AutoReels',
            },
            (progress) => {
              updatePlatformUpload(jobId, platform, 'uploading', progress);
              emitProgress(io, jobId, platform, 'uploading', progress);
            }
          );

          if (result.success) {
            updatePlatformUpload(
              jobId,
              platform,
              'success',
              100,
              null,
              result.remoteId
            );
            emitProgress(io, jobId, platform, 'success', 100, result.remoteId);
            return;
          }
          lastError = result.error ?? 'Upload failed';
        } catch (err) {
          lastError = err instanceof Error ? err.message : 'Upload failed';
        }
      }

      updatePlatformUpload(jobId, platform, 'failed', 0, lastError);
      emitProgress(io, jobId, platform, 'failed', 0, undefined, lastError);
    })
  );

  const rows = db
    .prepare(`SELECT status FROM platform_uploads WHERE job_id = ?`)
    .all(jobId) as Array<{ status: string }>;

  const allSuccess = rows.every((r) => r.status === 'success');
  const anyFailed = rows.some((r) => r.status === 'failed');
  const finalStatus = allSuccess ? 'completed' : anyFailed ? 'partial' : 'completed';

  db.prepare(
    `UPDATE upload_jobs SET status = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(finalStatus, jobId);

  io?.emit('job:complete', { jobId, status: finalStatus });
}

function updatePlatformUpload(
  jobId: string,
  platform: PlatformId,
  status: string,
  progress: number,
  error: string | null = null,
  remoteId?: string
) {
  db.prepare(
    `UPDATE platform_uploads
     SET status = ?, progress = ?, error = ?, remote_id = COALESCE(?, remote_id),
         updated_at = datetime('now')
     WHERE job_id = ? AND platform = ?`
  ).run(status, progress, error, remoteId ?? null, jobId, platform);
}

function emitProgress(
  io: SocketServer | undefined,
  jobId: string,
  platform: PlatformId,
  status: string,
  progress: number,
  remoteId?: string,
  error?: string
) {
  io?.emit('upload:progress', {
    jobId,
    platform,
    status,
    progress,
    remoteId,
    error,
  });
}
