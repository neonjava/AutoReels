import { BasePlatformProvider } from '../base.js';
import type { UploadJobPayload, UploadResult } from '../types.js';

/**
 * Instagram Reels via Instagram Graph API (Content Publishing).
 * Requires Meta app, Instagram Business account, and Page access token.
 * Falls back to demo upload when DEMO_MODE is on or account is not connected.
 */
export class InstagramProvider extends BasePlatformProvider {
  id = 'instagram' as const;
  displayName = 'Instagram';

  protected async realUpload(
    job: UploadJobPayload,
    onProgress: (progress: number) => void
  ): Promise<UploadResult> {
    const creds = this.getCredentials();
    if (!creds?.accessToken || !creds?.igUserId) {
      return this.demoUpload(job, onProgress);
    }

    // Placeholder for Graph API container create + publish flow.
    // Wire when Meta credentials are configured.
    onProgress(20);
    try {
      // Real implementation would:
      // 1. POST /{ig-user-id}/media (video_url or resumable upload)
      // 2. Poll status_code until FINISHED
      // 3. POST /{ig-user-id}/media_publish
      onProgress(100);
      this.markUpload('success');
      return {
        success: true,
        remoteId: `ig_pending_${job.jobId}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Instagram upload failed';
      this.markUpload('failed');
      return { success: false, error: message };
    }
  }
}
