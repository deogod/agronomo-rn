import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MediaDto } from '@/api/generated/model';

import { useOccurrenceMedia } from './use-occurrences';
import { usePhotoSource } from './use-photo-source';
import { ZoomablePhoto } from './zoomable-photo';

// Photos are viewed on black in both the light and the dark theme.
const BACKGROUND = '#000000';
const FOREGROUND = '#FFFFFF';

/** Full-screen photo (Flutter: a dialog page with InteractiveViewer). */
export function PhotoViewer({ mediaId }: { mediaId: number }) {
  const media = useOccurrenceMedia(mediaId);
  const insets = useSafeAreaInsets();
  const [failed, setFailed] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {media.isError || failed ? (
        <View style={styles.centered}>
          <Text style={styles.text}>Foto indisponível</Text>
        </View>
      ) : media.data ? (
        <LoadedPhoto media={media.data} onError={() => setFailed(true)} />
      ) : (
        <View style={styles.centered}>
          <ActivityIndicator color={FOREGROUND} />
        </View>
      )}

      {/* After the photo, so it stays on top of it while zoomed. */}
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        hitSlop={12}
        style={[styles.close, { top: insets.top + 8 }]}
      >
        <Text style={styles.text}>Fechar</Text>
      </Pressable>
    </View>
  );
}

function LoadedPhoto({ media, onError }: { media: MediaDto; onError: () => void }) {
  return <ZoomablePhoto source={usePhotoSource(media)} onError={onError} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: {
    position: 'absolute',
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  text: {
    color: FOREGROUND,
    fontSize: 16,
    fontWeight: '600',
  },
});
