import type { Request, Response } from 'express';
import { z } from 'zod';
import { getAllSettings, setSetting } from '../utils/settings.js';

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

export function getSettings(_req: Request, res: Response) {
  res.json({ settings: getAllSettings() });
}

export function updateSettings(req: Request, res: Response) {
  const schema = z.record(z.string(), z.string());
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid settings' });
  }

  for (const [key, value] of Object.entries(parsed.data)) {
    if (ALLOWED.has(key)) setSetting(key, value);
  }

  res.json({ settings: getAllSettings() });
}
