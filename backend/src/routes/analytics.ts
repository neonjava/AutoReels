import { Router } from 'express';
import { db } from '../database/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, requireAdmin, (_req, res) => {
  const uploadsOverTime = db
    .prepare(
      `SELECT date(created_at) as day, COUNT(*) as count
       FROM upload_jobs
       WHERE created_at >= datetime('now', '-30 days')
       GROUP BY date(created_at)
       ORDER BY day ASC`
    )
    .all();

  const byPlatform = db
    .prepare(
      `SELECT platform, status, COUNT(*) as count
       FROM platform_uploads
       GROUP BY platform, status`
    )
    .all();

  const successRate = db
    .prepare(
      `SELECT
         SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
         COUNT(*) as total
       FROM platform_uploads`
    )
    .get();

  const recent = db
    .prepare(
      `SELECT j.id, j.title, j.status, j.created_at, u.username as created_by_username
       FROM upload_jobs j
       JOIN users u ON u.id = j.created_by
       ORDER BY j.created_at DESC
       LIMIT 8`
    )
    .all();

  const totals = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM upload_jobs) as jobs,
         (SELECT COUNT(*) FROM users WHERE role = 'submitter') as submitters,
         (SELECT COUNT(*) FROM platform_accounts WHERE connected = 1) as connected`
    )
    .get();

  res.json({
    uploadsOverTime,
    byPlatform,
    successRate,
    recent,
    totals,
  });
});

export default router;
