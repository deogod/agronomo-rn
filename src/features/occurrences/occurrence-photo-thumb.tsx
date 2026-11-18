import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { MediaDto } from '@/api/generated/model';
import { env } from '@/config/env';
import { useAccessToken } from '@/features/auth/session-store';
import { AppText, useTheme, type Theme } from '@/ui';

/**
 * Photo thumbnail. The API serves photos only with the Bearer header, so the
 * URL alone is not enough (Flutter: Image.network with headers).
 *
 * - cacheKey: the token changes every few minutes; the photo does not.
 * - cachePolicy "memory": private farm photos are not left on disk after logout.
 */
export function OccurrencePhotoThumb({ media }: { media: MediaDto }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const token = useAccessToken();
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <View style={[styles.thumb, styles.fallback]}>
        <AppText variant="caption" tone="muted">
          Foto indisponível
        </AppText>
      </View>
    );
  }

  return (
    <Image
      source={{
        uri: env.apiUrl + media.contentUrl,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cacheKey: `media-${media.id}`,
      }}
      cachePolicy="memory"
      contentFit="cover"
      transition={150}
      accessibilityLabel="Foto da ocorrência"
      onError={() => setFailed(true)}
      style={styles.thumb}
    />
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    thumb: {
      width: 110,
      height: 110,
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.secondaryContainer,
    },
    fallback: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xs,
    },
  });
