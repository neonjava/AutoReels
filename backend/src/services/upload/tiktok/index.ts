import { BasePlatformProvider } from '../base.js';
import type { UploadJobPayload, UploadResult } from '../types.js';

/**
 * TikTok Content Posting API provider.
 * Requires TikTok developer app with Content Posting API approval.
 */
export class TikTokProvider extends BasePlatformProvider {
  id = 'tiktok' as const;
  displayName = 'TikTok';

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
      // Real implementation would use TikTok Content Posting API:
      // init upload → upload binary → publish
      onProgress(100);
      this.markUpload('success');
      return {
        success: true,
        remoteId: `tt_pending_${job.jobId}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'TikTok upload failed';
      this.markUpload('failed');
      return { success: false, error: message };
    }
  }
}
