import { getDefaultHashtags } from '../../utils/settings.js';

export function buildCaption(title: string, description?: string): string {
  const hashtags = getDefaultHashtags()
    .split(/\r?\n/)
    .map((h) => h.trim())
    .filter(Boolean)
    .join('\n');

  const body = [title.trim(), description?.trim()].filter(Boolean).join('\n\n');
  return `${body}\n\n${hashtags}`.trim();
}

export function appendHashtags(caption: string): string {
  const hashtags = getDefaultHashtags()
    .split(/\r?\n/)
    .map((h) => h.trim())
    .filter(Boolean);

  let result = caption.trim();
  for (const tag of hashtags) {
    if (!result.toLowerCase().includes(tag.toLowerCase())) {
      result += `\n${tag}`;
    }
  }
  return result.trim();
}
