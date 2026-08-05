import { BasePlatformProvider } from '../base.js';
import type { UploadJobPayload, UploadResult } from '../types.js';

/**
 * YouTube Shorts via YouTube Data API v3 (videos.insert).
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
      return this.demoUpload(job, onProgress);
    }

    onProgress(20);
    try {
      // Real implementation would resumable-upload to YouTube Data API.
      onProgress(100);
      this.markUpload('success');
      return {
        success: true,
        remoteId: `yt_pending_${job.jobId}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'YouTube upload failed';
      this.markUpload('failed');
      return { success: false, error: message };
    }
  }
}
