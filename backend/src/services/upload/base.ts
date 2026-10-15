import { db } from '../../database/index.js';
import { encrypt, decrypt } from '../crypto/index.js';
import type {
  ConnectionInfo,
  PlatformId,
  PlatformProvider,
  UploadJobPayload,
  UploadResult,
} from './types.js';

export abstract class BasePlatformProvider implements PlatformProvider {
  abstract id: PlatformId;
  abstract displayName: string;

  getConnectionStatus(): ConnectionInfo {
    const row = db
      .prepare(
        `SELECT username, connected, last_upload_at, last_status FROM platform_accounts WHERE platform = ?`
      )
      .get(this.id) as
      | {
          username: string | null;
          connected: number;
          last_upload_at: string | null;
          last_status: string | null;
        }
      | undefined;

    return {
      platform: this.id,
      connected: Boolean(row?.connected),
      username: row?.username ?? null,
      lastUploadAt: row?.last_upload_at ?? null,
      lastStatus: row?.last_status ?? null,
      demo: false,
    };
  }

  connect(input: { username: string; credentials: Record<string, string> }) {
    const enc = encrypt(JSON.stringify(input.credentials));
    db.prepare(
      `UPDATE platform_accounts
       SET username = ?, connected = 1, credentials_enc = ?, updated_at = datetime('now')
       WHERE platform = ?`
    ).run(input.username, enc, this.id);
  }

  disconnect() {
    db.prepare(
      `UPDATE platform_accounts
       SET connected = 0, credentials_enc = NULL, username = NULL, updated_at = datetime('now')
       WHERE platform = ?`
    ).run(this.id);
  }

  protected getCredentials(): Record<string, string> | null {
    const row = db
      .prepare(`SELECT credentials_enc FROM platform_accounts WHERE platform = ?`)
      .get(this.id) as { credentials_enc: string | null } | undefined;
    if (!row?.credentials_enc) return null;
    return JSON.parse(decrypt(row.credentials_enc)) as Record<string, string>;
  }

  protected markUpload(status: string) {
    db.prepare(
      `UPDATE platform_accounts
       SET last_upload_at = datetime('now'), last_status = ?, updated_at = datetime('now')
       WHERE platform = ?`
    ).run(status, this.id);
  }

  async upload(
    job: UploadJobPayload,
    onProgress: (progress: number) => void
  ): Promise<UploadResult> {
    const status = this.getConnectionStatus();
    if (!status.connected) return { success: false, error: 'Platform account is not connected' };
    return this.realUpload(job, onProgress);
  }

  /** Real API path — override in each provider when credentials are present. */
  protected abstract realUpload(
    job: UploadJobPayload,
    onProgress: (progress: number) => void
  ): Promise<UploadResult>;
}
