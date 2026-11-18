import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { AppText, useTheme, type Theme } from '@/ui';

type Notice = { title: string; body: string };

// A tiny global store: the push listener (outside any screen) sets the notice,
// the component below renders it (Flutter: Toastification.show).
const useNoticeStore = create<{ notice: Notice | null }>(() => ({ notice: null }));

export function showNotice(notice: Notice) {
  useNoticeStore.setState({ notice });
}

function hideNotice() {
  useNoticeStore.setState({ notice: null });
}

const VISIBLE_MS = 5000;

/**
 * Banner for a push that arrives while the app is open (the system does not
 * show it then). Tapping it opens the notifications screen.
 */
export function InAppNotice() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const notice = useNoticeStore((state) => state.notice);

  // Restarts the timer for each new notice; the cleanup cancels the old one.
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(hideNotice, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  if (!notice) return null;

  return (
    // box-none: the wrapper lets touches through; only the card takes them.
    <View pointerEvents="box-none" style={[styles.wrapper, { top: insets.top + theme.spacing.sm }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLiveRegion="polite"
        onPress={() => {
          hideNotice();
          router.push('/notifications');
        }}
        style={styles.card}
      >
        <AppText variant="subtitle" numberOfLines={1}>
          {notice.title}
        </AppText>
        <AppText tone="muted" numberOfLines={2}>
          {notice.body}
        </AppText>
      </Pressable>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: theme.spacing.md,
      right: theme.spacing.md,
    },
    card: {
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      // Elevation (Android) and shadow (iOS) are separate props in RN.
      elevation: 6,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
  });
