import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import fs from 'node:fs';
import { db } from '../database/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { downloadYouTubeShort } from '../services/download/index.js';
import { buildCaption, appendHashtags } from '../services/caption/index.js';
import { uploadToPlatforms } from '../services/upload/index.js';
import { getSetting } from '../utils/settings.js';
import type { PlatformId } from '../services/upload/types.js';
import type { Server as SocketServer } from 'socket.io';

export function createUploadRouter(io: SocketServer) {
  const router = Router();

  router.post('/preview', requireAuth, async (req, res) => {
    const schema = z.object({ url: z.string().url() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Valid YouTube URL required' });
    }

    try {
      const downloaded = await downloadYouTubeShort(parsed.data.url);
      const caption = buildCaption(downloaded.title, downloaded.description);
      res.json({
        url: parsed.data.url,
        title: downloaded.title,
        description: downloaded.description,
        caption,
        videoPath: downloaded.videoPath,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download failed';
      res.status(500).json({ error: message });
    }
  });

  router.post('/', requireAuth, async (req, res) => {
    const schema = z.object({
      url: z.string().url(),
      caption: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      videoPath: z.string().optional(),
      platforms: z
        .array(z.enum(['instagram', 'tiktok', 'youtube']))
        .min(1)
        .optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const isAdmin = req.user!.role === 'admin';
    const defaultPlatforms = getSetting('default_platforms', 'instagram,tiktok,youtube')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean) as PlatformId[];

    const platforms = isAdmin
      ? (parsed.data.platforms ?? defaultPlatforms)
      : defaultPlatforms;

    if (!platforms.length) {
      return res.status(400).json({ error: 'No platforms selected' });
    }

    try {
      let videoPath = parsed.data.videoPath;
      let title = parsed.data.title ?? 'Untitled';
      let description = parsed.data.description ?? '';

      if (!videoPath) {
        const downloaded = await downloadYouTubeShort(parsed.data.url);
        videoPath = downloaded.videoPath;
        title = downloaded.title;
        description = downloaded.description;
      }

      let caption =
        parsed.data.caption ?? buildCaption(title, description);
      if (!isAdmin) {
        caption = appendHashtags(caption);
      }

      const jobId = uuid();
      db.prepare(
        `INSERT INTO upload_jobs (id, source_url, title, description, caption, video_path, created_by, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'queued')`
      ).run(
        jobId,
        parsed.data.url,
        title,
        description,
        caption,
        videoPath,
        req.user!.id
      );

      const insertPlatform = db.prepare(
        `INSERT INTO platform_uploads (job_id, platform, status, progress) VALUES (?, ?, 'pending', 0)`
      );
      for (const p of platforms) insertPlatform.run(jobId, p);

      // Fire and forget upload pipeline
      void uploadToPlatforms(jobId, platforms, io).finally(() => {
        if (getSetting('auto_delete_videos', 'false') === 'true' && videoPath) {
          try {
            fs.unlinkSync(videoPath);
          } catch {
            /* ignore */
          }
        }
      });

      res.status(201).json({
        job: getJob(jobId),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      res.status(500).json({ error: message });
    }
  });

  router.patch('/:id/caption', requireAuth, requireAdmin, (req, res) => {
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
  });

  return router;
}

function getJob(id: string) {
  const job = db
    .prepare(
      `SELECT j.*, u.username as created_by_username
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

export default createUploadRouter;
