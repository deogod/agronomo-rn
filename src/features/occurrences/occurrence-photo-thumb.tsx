import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { MediaDto } from '@/api/generated/model';
import { AppText, useTheme, type Theme } from '@/ui';

import { usePhotoSource } from './use-photo-source';

/**
 * Photo thumbnail; a tap opens it in full screen. cachePolicy "memory": private
 * farm photos are not left on disk after logout.
 */
export function OccurrencePhotoThumb({ media }: { media: MediaDto }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const source = usePhotoSource(media);
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
    <Pressable
      onPress={() =>
        router.push({ pathname: '/photo/[mediaId]', params: { mediaId: String(media.id) } })
      }
      accessibilityRole="button"
      accessibilityLabel="Ampliar foto"
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Image
        source={source}
        cachePolicy="memory"
        contentFit="cover"
        transition={150}
        onError={() => setFailed(true)}
        style={styles.thumb}
      />
    </Pressable>
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
    pressed: {
      opacity: 0.7,
    },
  });
