import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { getAllSettings, setSetting } from '../utils/settings.js';

const router = Router();

const ALLOWED = new Set([
  'default_hashtags',
  'download_location',
  'auto_delete_videos',
  'theme',
  'upload_quality',
  'retry_count',
  'default_platforms',
  'demo_mode',
]);

router.get('/', requireAuth, (_req, res) => {
  const settings = getAllSettings();
  // Never expose encrypted secrets via settings
  res.json({ settings });
});

router.put('/', requireAuth, requireAdmin, (req, res) => {
  const schema = z.record(z.string(), z.string());
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid settings' });
  }

  for (const [key, value] of Object.entries(parsed.data)) {
    if (ALLOWED.has(key)) setSetting(key, value);
  }

  res.json({ settings: getAllSettings() });
});

export default router;
