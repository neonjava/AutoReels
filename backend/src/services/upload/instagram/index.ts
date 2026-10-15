import fs from 'node:fs';
import { BasePlatformProvider } from '../base.js';
import type { UploadJobPayload, UploadResult } from '../types.js';
import { getSetting } from '../../../utils/settings.js';
import {
  createStagingToken,
  getPublicBaseUrl,
  isPubliclyReachableBase,
} from '../../staging.js';

const IG_GRAPH = 'https://graph.instagram.com/v21.0';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Instagram Reels via Instagram API with Instagram Login (graph.instagram.com).
 * Requires a public video URL served by this application.
 * Multiple account slots (instagram, instagram2) share this provider class.
 */
export class InstagramProvider extends BasePlatformProvider {
  constructor(
    public id: 'instagram' | 'instagram2' = 'instagram',
    public displayName = id === 'instagram2' ? 'Instagram 2' : 'Instagram'
  ) {
    super();
  }

  protected async realUpload(
    job: UploadJobPayload,
    onProgress: (progress: number) => void
  ): Promise<UploadResult> {
    const creds = this.getCredentials();
    if (!creds?.accessToken || !creds?.igUserId) {
      return { success: false, error: 'Instagram credentials are incomplete' };
    }

    onProgress(5);
    try {
      const videoUrl = await this.ensurePublicVideoUrl(job.videoPath);
      onProgress(25);

      const containerId = await this.createReelContainer(
        creds.igUserId,
        creds.accessToken,
        videoUrl,
        job.caption
      );
      onProgress(45);

      await this.waitForContainer(containerId, creds.accessToken, onProgress);
      onProgress(85);

      const published = await this.publishContainer(
        creds.igUserId,
        creds.accessToken,
        containerId
      );
      onProgress(100);
      this.markUpload('success');
      return { success: true, remoteId: published };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Instagram upload failed';
      this.markUpload('failed');
      return { success: false, error: message };
    }
  }

  private async ensurePublicVideoUrl(videoPath: string): Promise<string> {
    if (/^https?:\/\//i.test(videoPath)) return videoPath;
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }

    const base = getPublicBaseUrl();
    if (isPubliclyReachableBase(base)) {
      const token = createStagingToken(videoPath);
      return `${base}/api/stage/${token}`;
    }

    throw new Error('Set PUBLIC_BASE_URL to a public HTTPS server URL for Instagram publishing');
  }

  private async createReelContainer(
    igUserId: string,
    accessToken: string,
    videoUrl: string,
    caption: string
  ): Promise<string> {
    const hideCounts = getSetting('ig_hide_like_counts', 'true') === 'true';
    const shareToFeed = getSetting('ig_share_to_feed', 'true') === 'true';

    const body = new URLSearchParams({
      media_type: 'REELS',
      video_url: videoUrl,
      caption,
      share_to_feed: shareToFeed ? 'true' : 'false',
      access_token: accessToken,
    });

    // Hide like & view counts when supported by Instagram Content Publishing
    if (hideCounts) {
      body.set('like_and_view_counts_disabled', 'true');
    }

    const res = await fetch(`${IG_GRAPH}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = (await res.json()) as { id?: string; error?: { message: string } };
    if (!res.ok || !data.id) {
      throw new Error(data.error?.message || 'Failed to create Instagram media container');
    }
    return data.id;
  }

  private async waitForContainer(
    containerId: string,
    accessToken: string,
    onProgress: (progress: number) => void
  ) {
    for (let i = 0; i < 40; i++) {
      const res = await fetch(
        `${IG_GRAPH}/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(accessToken)}`
      );
      const data = (await res.json()) as {
        status_code?: string;
        status?: string;
        error?: { message: string };
      };
      if (data.error?.message) throw new Error(data.error.message);

      const code = data.status_code || '';
      if (code === 'FINISHED') return;
      if (code === 'ERROR') {
        throw new Error(data.status || 'Instagram finished processing with ERROR');
      }

      onProgress(45 + Math.min(35, i));
      await sleep(3000);
    }
    throw new Error('Timed out waiting for Instagram to process the Reel');
  }

  private async publishContainer(
    igUserId: string,
    accessToken: string,
    containerId: string
  ): Promise<string> {
    const body = new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken,
    });
    const res = await fetch(`${IG_GRAPH}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = (await res.json()) as { id?: string; error?: { message: string } };
    if (!res.ok || !data.id) {
      throw new Error(data.error?.message || 'Failed to publish Instagram Reel');
    }
    return data.id;
  }
}
