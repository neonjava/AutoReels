import type { Request, Response } from 'express';
import { z } from 'zod';
import { listProviders, getProvider } from '../services/upload/index.js';
import { isPlatformId } from '../services/upload/platformIds.js';
import type { PlatformId } from '../services/upload/types.js';

export function listPlatforms(_req: Request, res: Response) {
  const platforms = listProviders().map((p) => p.getConnectionStatus());
  res.json({ platforms });
}

export function connectPlatform(req: Request, res: Response) {
  const platform = req.params.platform as string;
  if (!isPlatformId(platform)) {
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
  if (!parsed.data.credentials.accessToken) {
    return res.status(400).json({ error: 'Access token is required' });
  }
  if ((platform === 'instagram' || platform === 'instagram2') && !parsed.data.credentials.igUserId) {
    return res.status(400).json({ error: 'Instagram User ID is required' });
  }

  getProvider(platform as PlatformId).connect(parsed.data);
  res.json({ platform: getProvider(platform as PlatformId).getConnectionStatus() });
}

export function disconnectPlatform(req: Request, res: Response) {
  const platform = req.params.platform as string;
  if (!isPlatformId(platform)) {
    return res.status(400).json({ error: 'Unknown platform' });
  }
  getProvider(platform as PlatformId).disconnect();
  res.json({ platform: getProvider(platform as PlatformId).getConnectionStatus() });
}
