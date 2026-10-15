import fs from 'node:fs';
import { BasePlatformProvider } from '../base.js';
import type { UploadJobPayload, UploadResult } from '../types.js';
import { getSetting } from '../../../utils/settings.js';

/**
 * YouTube Shorts via YouTube Data API v3 (resumable videos.insert).
 * Requires Google OAuth with youtube.upload scope.
 */
export class YouTubeProvider extends BasePlatformProvider {
  id = 'youtube' as const;
  displayName = 'YouTube Shorts';

  protected async realUpload(
    job: UploadJobPayload,
    onProgress: (progress: number) => void
  ): Promise<UploadResult> {
    const creds = this.getCredentials();
    if (!creds?.accessToken) {
      return { success: false, error: 'YouTube access token is missing' };
    }

    onProgress(5);
    try {
      if (!fs.existsSync(job.videoPath)) {
        throw new Error(`Video file not found: ${job.videoPath}`);
      }

      const fileSize = fs.statSync(job.videoPath).size;
      const hideStats = getSetting('yt_hide_public_stats', 'true') === 'true';
      const metadata = {
        snippet: {
          title: (job.title || 'AutoReels Short').slice(0, 100),
          description: job.caption.slice(0, 5000),
          categoryId: '22',
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
          // Hides extended public stats on the watch page (YouTube API equivalent)
          publicStatsViewable: !hideStats,
        },
      };

      onProgress(15);
      const initRes = await fetch(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${creds.accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Length': String(fileSize),
            'X-Upload-Content-Type': 'video/mp4',
          },
          body: JSON.stringify(metadata),
        }
      );

      if (!initRes.ok) {
        const err = (await initRes.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(err.error?.message || `YouTube init failed (${initRes.status})`);
      }

      const uploadUrl = initRes.headers.get('location');
      if (!uploadUrl) {
        throw new Error('YouTube did not return a resumable upload URL');
      }

      onProgress(35);
      const videoBuf = fs.readFileSync(job.videoPath);
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': String(fileSize),
        },
        body: videoBuf,
      });

      const uploaded = (await uploadRes.json()) as {
        id?: string;
        error?: { message?: string };
      };

      if (!uploadRes.ok || !uploaded.id) {
        throw new Error(uploaded.error?.message || `YouTube upload failed (${uploadRes.status})`);
      }

      onProgress(100);
      this.markUpload('success');
      return { success: true, remoteId: uploaded.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'YouTube upload failed';
      this.markUpload('failed');
      return { success: false, error: message };
    }
  }
}
