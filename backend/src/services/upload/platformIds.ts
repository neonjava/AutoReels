/** Shared platform IDs used across API + upload providers. */
export const PLATFORM_IDS = [
  'instagram',
  'instagram2',
  'tiktok',
  'youtube',
] as const;

export type PlatformId = (typeof PLATFORM_IDS)[number];

export function isPlatformId(value: string): value is PlatformId {
  return (PLATFORM_IDS as readonly string[]).includes(value);
}

export function platformLabel(id: string): string {
  switch (id) {
    case 'instagram':
      return 'Instagram';
    case 'instagram2':
      return 'Instagram 2';
    case 'tiktok':
      return 'TikTok';
    case 'youtube':
      return 'YouTube Shorts';
    default:
      return id;
  }
}

export function isInstagramPlatform(id: string): boolean {
  return id === 'instagram' || id === 'instagram2';
}
