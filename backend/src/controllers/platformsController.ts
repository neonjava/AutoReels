import type { Request, Response } from 'express';
import { z } from 'zod';
import { listProviders, getProvider } from '../services/upload/index.js';
import type { PlatformId } from '../services/upload/types.js';

export function listPlatforms(_req: Request, res: Response) {
  const platforms = listProviders().map((p) => p.getConnectionStatus());
  res.json({ platforms });
}

export function connectPlatform(req: Request, res: Response) {
  const platform = req.params.platform as PlatformId;
  if (!['instagram', 'tiktok', 'youtube'].includes(platform)) {
    return res.status(400).json({ error: 'Unknown platform' });
  }

  const schema = z.object({
    username: z.string().min(1),
    credentials: z.record(z.string(), z.string()),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid connect payload' });
  }

  getProvider(platform).connect(parsed.data);
  res.json({ platform: getProvider(platform).getConnectionStatus() });
}

export function disconnectPlatform(req: Request, res: Response) {
  const platform = req.params.platform as PlatformId;
  if (!['instagram', 'tiktok', 'youtube'].includes(platform)) {
    return res.status(400).json({ error: 'Unknown platform' });
  }
  getProvider(platform).disconnect();
  res.json({ platform: getProvider(platform).getConnectionStatus() });
}
