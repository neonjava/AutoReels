import fs from 'node:fs/promises';
import { BasePlatformProvider } from '../base.js';
import type { UploadJobPayload, UploadResult } from '../types.js';

const API = 'https://open.tiktokapis.com/v2/post/publish';
const CHUNK_SIZE = 10 * 1024 * 1024;

export class TikTokProvider extends BasePlatformProvider {
  id = 'tiktok' as const;
  displayName = 'TikTok';

  protected async realUpload(job: UploadJobPayload, onProgress: (progress: number) => void): Promise<UploadResult> {
    const token = this.getCredentials()?.accessToken;
    if (!token) return { success: false, error: 'TikTok access token is missing' };

    try {
      const file = await fs.open(job.videoPath, 'r');
      try {
        const size = (await file.stat()).size;
        if (!size) throw new Error('Video is empty');
        const count = Math.max(1, Math.floor(size / CHUNK_SIZE));
        const chunkSize = count === 1 ? size : CHUNK_SIZE;
        const initResponse = await fetch(`${API}/video/init/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8' },
          body: JSON.stringify({
            post_info: { title: job.caption.slice(0, 2200), privacy_level: 'PUBLIC_TO_EVERYONE', disable_duet: false, disable_comment: false, disable_stitch: false },
            source_info: { source: 'FILE_UPLOAD', video_size: size, chunk_size: chunkSize, total_chunk_count: count },
          }),
        });
        const init = await initResponse.json() as { data?: { publish_id?: string; upload_url?: string }; error?: { code?: string; message?: string } };
        if (!initResponse.ok || init.error?.code !== 'ok' || !init.data?.publish_id || !init.data.upload_url) {
          throw new Error(init.error?.message || 'TikTok upload initialization failed');
        }
        for (let i = 0; i < count; i++) {
          const start = i * CHUNK_SIZE;
          const length = i === count - 1 ? size - start : CHUNK_SIZE;
          const buffer = Buffer.allocUnsafe(length);
          let offset = 0;
          while (offset < length) {
            const { bytesRead } = await file.read(buffer, offset, length - offset, start + offset);
            if (bytesRead === 0) throw new Error('Video ended during TikTok upload');
            offset += bytesRead;
          }
          const upload = await fetch(init.data.upload_url, {
            method: 'PUT',
            headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(length), 'Content-Range': `bytes ${start}-${start + length - 1}/${size}` },
            body: buffer,
          });
          if (!upload.ok) throw new Error(`TikTok video transfer failed (${upload.status})`);
          onProgress(Math.round(((i + 1) / count) * 80));
        }

        for (let i = 0; i < 60; i++) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          const statusResponse = await fetch(`${API}/status/fetch/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify({ publish_id: init.data.publish_id }),
          });
          const status = await statusResponse.json() as { data?: { status?: string; fail_reason?: string }; error?: { message?: string } };
          if (!statusResponse.ok) throw new Error(status.error?.message || 'TikTok status check failed');
          if (status.data?.status === 'PUBLISH_COMPLETE') {
            onProgress(100);
            this.markUpload('success');
            return { success: true, remoteId: init.data.publish_id };
          }
          if (status.data?.status === 'FAILED') throw new Error(status.data.fail_reason || 'TikTok rejected the post');
          onProgress(Math.min(95, 80 + i / 4));
        }
        throw new Error(`TikTok is still processing publish ${init.data.publish_id}; check TikTok before retrying`);
      } finally {
        await file.close();
      }
    } catch (error) {
      this.markUpload('failed');
      return { success: false, error: error instanceof Error ? error.message : 'TikTok upload failed' };
    }
  }
}
