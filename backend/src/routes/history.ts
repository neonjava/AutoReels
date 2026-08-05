import { Router } from 'express';
import { db } from '../database/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const isAdmin = req.user!.role === 'admin';
  const jobs = isAdmin
    ? (db
        .prepare(
          `SELECT j.*, u.username as created_by_username
           FROM upload_jobs j
           JOIN users u ON u.id = j.created_by
           ORDER BY j.created_at DESC
           LIMIT 100`
        )
        .all() as Array<{ id: string }>)
    : (db
        .prepare(
          `SELECT j.*, u.username as created_by_username
           FROM upload_jobs j
           JOIN users u ON u.id = j.created_by
           WHERE j.created_by = ?
           ORDER BY j.created_at DESC
           LIMIT 100`
        )
        .all(req.user!.id) as Array<{ id: string }>);

  const platformStmt = db.prepare(
    `SELECT * FROM platform_uploads WHERE job_id = ? ORDER BY platform`
  );

  const result = jobs.map((job) => ({
    ...job,
    platforms: platformStmt.all(job.id),
  }));

  res.json({ jobs: result });
});

router.get('/:id', requireAuth, (req, res) => {
  const job = db
    .prepare(
      `SELECT j.*, u.username as created_by_username
       FROM upload_jobs j
       JOIN users u ON u.id = j.created_by
       WHERE j.id = ?`
    )
    .get(req.params.id) as { id: string; created_by: number } | undefined;

  if (!job) return res.status(404).json({ error: 'Not found' });
  if (req.user!.role !== 'admin' && job.created_by !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const platforms = db
    .prepare(`SELECT * FROM platform_uploads WHERE job_id = ?`)
    .all(job.id);

  res.json({ job: { ...job, platforms } });
});

export default router;
