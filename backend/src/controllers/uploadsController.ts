import type { Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import fs from 'node:fs';
import type { Server as SocketServer } from 'socket.io';
import { db } from '../database/index.js';
import { appendHashtags } from '../services/caption/index.js';
import { getProvider, uploadToPlatforms } from '../services/upload/index.js';
import {
  getUploadDelayHours,
  nextQueuedSchedule,
} from '../services/scheduler.js';
import { getSetting } from '../utils/settings.js';
import type { PlatformId } from '../services/upload/types.js';

function getJob(id: string) {
  const job = db
    .prepare(
      `SELECT j.id, j.source_url, j.title, j.description, j.caption, j.status,
              j.created_at, j.updated_at, j.scheduled_for, u.username as created_by_username
       FROM upload_jobs j
       JOIN users u ON u.id = j.created_by
       WHERE j.id = ?`
    )
    .get(id);
  const platforms = db
    .prepare(`SELECT * FROM platform_uploads WHERE job_id = ?`)
    .all(id);
  return { ...(job as object), platforms };
}

export function createUploadController(io: SocketServer) {
  async function create(req: Request, res: Response) {
    const schema = z.object({
      caption: z.string().min(1),
      title: z.string().min(1),
      platforms: z.string().optional(),
      /** Admin-only: skip the delay and publish immediately */
      publishNow: z.string().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    if (!req.file) return res.status(400).json({ error: 'MP4 video file required' });

    const isAdmin = req.user!.role === 'admin';
    const connected = (['instagram', 'instagram2', 'tiktok', 'youtube'] as PlatformId[])
      .filter((platform) => getProvider(platform).getConnectionStatus().connected);
    let selected: unknown;
    try {
      selected = parsed.data.platforms ? JSON.parse(parsed.data.platforms) : connected;
    } catch {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid platforms' });
    }
    const platforms = isAdmin && Array.isArray(selected)
      ? selected.filter((p): p is PlatformId => connected.includes(p))
      : connected;

    if (!platforms.length) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Connect a platform account before uploading' });
    }

    try {
      const videoPath = req.file.path;
      const title = parsed.data.title;
      let caption = parsed.data.caption;
      if (!isAdmin) {
        caption = appendHashtags(caption);
      }

      const delayHours = getUploadDelayHours();
      const publishNow = Boolean(isAdmin && parsed.data.publishNow === 'true');
      const useDelay = !publishNow && delayHours > 0;
      const scheduledFor = useDelay ? nextQueuedSchedule(delayHours) : null;
      const status = useDelay ? 'scheduled' : 'queued';

      const jobId = uuid();
      db.prepare(
        `INSERT INTO upload_jobs
          (id, source_url, title, description, caption, video_path, created_by, status, scheduled_for, platforms_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        jobId,
        'local-upload',
        title,
        '',
        caption,
        videoPath,
        req.user!.id,
        status,
        scheduledFor,
        JSON.stringify(platforms)
      );

      const insertPlatform = db.prepare(
        `INSERT INTO platform_uploads (job_id, platform, status, progress) VALUES (?, ?, ?, 0)`
      );
      for (const p of platforms) {
        insertPlatform.run(jobId, p, useDelay ? 'scheduled' : 'pending');
      }

      if (!useDelay) {
        void uploadToPlatforms(jobId, platforms, io).finally(() => {
          if (getSetting('auto_delete_videos', 'false') === 'true' && videoPath) {
            try {
              fs.unlinkSync(videoPath);
            } catch {
              /* ignore */
            }
          }
        });
      } else {
        io.emit('job:scheduled', {
          jobId,
          scheduledFor,
          delayHours,
        });
      }

      res.status(201).json({
        job: getJob(jobId),
        delayHours: useDelay ? delayHours : 0,
        scheduledFor,
      });
    } catch (err) {
      fs.unlinkSync(req.file.path);
      const message = err instanceof Error ? err.message : 'Upload failed';
      res.status(500).json({ error: message });
    }
  }

  function updateCaption(req: Request, res: Response) {
    const schema = z.object({ caption: z.string().min(1) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Caption required' });
    }
    const id = String(req.params.id);
    db.prepare(
      `UPDATE upload_jobs SET caption = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(parsed.data.caption, id);
    res.json({ job: getJob(id) });
  }

  /** Admin: publish a scheduled job immediately */
  async function publishNow(req: Request, res: Response) {
    const id = String(req.params.id);
    const job = db
      .prepare(`SELECT id, platforms_json, status, video_path FROM upload_jobs WHERE id = ?`)
      .get(id) as
      | {
          id: string;
          platforms_json: string | null;
          status: string;
          video_path: string | null;
        }
      | undefined;

    if (!job) return res.status(404).json({ error: 'Not found' });
    if (job.status !== 'scheduled') {
      return res.status(400).json({ error: 'Job is not scheduled' });
    }

    let platforms: PlatformId[] = [];
    try {
      platforms = JSON.parse(job.platforms_json || '[]') as PlatformId[];
    } catch {
      platforms = [];
    }
    if (!platforms.length) {
      return res.status(400).json({ error: 'No platforms on job' });
    }

    db.prepare(
      `UPDATE upload_jobs
       SET scheduled_for = datetime('now'), status = 'queued', updated_at = datetime('now')
       WHERE id = ?`
    ).run(id);
    db.prepare(
      `UPDATE platform_uploads SET status = 'pending', progress = 0, updated_at = datetime('now')
       WHERE job_id = ?`
    ).run(id);

    void uploadToPlatforms(id, platforms, io).finally(() => {
      if (getSetting('auto_delete_videos', 'false') === 'true' && job.video_path) {
        try {
          fs.unlinkSync(job.video_path);
        } catch {
          /* ignore */
        }
      }
    });

    res.json({ job: getJob(id) });
  }

  return { create, updateCaption, publishNow };
}
