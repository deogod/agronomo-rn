import type { ImageSource } from 'expo-image';

import type { MediaDto } from '@/api/generated/model';
import { env } from '@/config/env';
import { useAccessToken } from '@/features/auth/session-store';

/**
 * Image source of a private photo. The API serves photos only with the Bearer
 * header, so the URL alone is not enough (Flutter: Image.network with headers).
 *
 * cacheKey: the token changes every few minutes; the photo does not. It also
 * lets the full-screen viewer reuse the image the thumbnail already loaded.
 */
export function usePhotoSource(media: MediaDto): ImageSource {
  const token = useAccessToken();
  return {
    uri: env.apiUrl + media.contentUrl,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cacheKey: `media-${media.id}`,
  };
}
