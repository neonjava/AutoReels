import type { Request, Response } from 'express';
import { db } from '../database/index.js';

function attachPlatforms<T extends { id: string }>(jobs: T[]) {
  const platformStmt = db.prepare(
    `SELECT * FROM platform_uploads WHERE job_id = ? ORDER BY platform`
  );
  return jobs.map((job) => ({
    ...job,
    platforms: platformStmt.all(job.id),
  }));
}

export function listHistory(req: Request, res: Response) {
  const isAdmin = req.user!.role === 'admin';
  const jobs = isAdmin
    ? (db
        .prepare(
          `SELECT j.id, j.source_url, j.title, j.description, j.caption, j.status,
                  j.created_at, j.updated_at, j.scheduled_for, u.username as created_by_username
           FROM upload_jobs j
           JOIN users u ON u.id = j.created_by
           ORDER BY j.created_at DESC
           LIMIT 100`
        )
        .all() as Array<{ id: string }>)
    : (db
        .prepare(
          `SELECT j.id, j.source_url, j.title, j.description, j.caption, j.status,
                  j.created_at, j.updated_at, j.scheduled_for, u.username as created_by_username
           FROM upload_jobs j
           JOIN users u ON u.id = j.created_by
           WHERE j.created_by = ?
           ORDER BY j.created_at DESC
           LIMIT 100`
        )
        .all(req.user!.id) as Array<{ id: string }>);

  res.json({ jobs: attachPlatforms(jobs) });
}

export function getHistoryItem(req: Request, res: Response) {
  const job = db
    .prepare(
      `SELECT j.id, j.created_by, j.source_url, j.title, j.description, j.caption, j.status,
              j.created_at, j.updated_at, j.scheduled_for, u.username as created_by_username
       FROM upload_jobs j
       JOIN users u ON u.id = j.created_by
       WHERE j.id = ?`
    )
    .get(String(req.params.id)) as { id: string; created_by: number } | undefined;

  if (!job) return res.status(404).json({ error: 'Not found' });
  if (req.user!.role !== 'admin' && job.created_by !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const platforms = db
    .prepare(`SELECT * FROM platform_uploads WHERE job_id = ?`)
    .all(job.id);

  const { created_by, ...publicJob } = job;
  res.json({ job: { ...publicJob, platforms } });
}
