export type PlatformId = 'instagram' | 'tiktok' | 'youtube';

export interface ConnectionInfo {
  platform: PlatformId;
  connected: boolean;
  username: string | null;
  lastUploadAt: string | null;
  lastStatus: string | null;
  demo: boolean;
}

export interface UploadJobPayload {
  jobId: string;
  videoPath: string;
  caption: string;
  title: string;
}

export interface UploadResult {
  success: boolean;
  remoteId?: string;
  error?: string;
}

export interface PlatformProvider {
  id: PlatformId;
  getConnectionStatus(): ConnectionInfo;
  connect(input: { username: string; credentials: Record<string, string> }): void;
  disconnect(): void;
  upload(
    job: UploadJobPayload,
    onProgress: (progress: number) => void
  ): Promise<UploadResult>;
}
