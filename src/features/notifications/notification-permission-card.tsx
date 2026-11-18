import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Linking, StyleSheet, View } from 'react-native';

import { AppText, Button, useTheme, type Theme } from '@/ui';

import { getPushPermission, requestPushPermission, type PushPermission } from './permission';

type CardState = { permission: PushPermission; dismissed: boolean };

const dismissedKey = (userId: number) => `notifications.permissionCardDismissed.${userId}`;

/**
 * Asks for the notification permission with an explanation first, never at
 * startup (Flutter: the /notification-permission screen, once per account per
 * device).
 *
 * The state is device state, not server data, but useQuery still fits: it is
 * async, and TanStack refetches it when the app returns to the foreground
 * (focusManager + AppState), so a change made in the settings app shows up.
 */
export function NotificationPermissionCard({ userId }: { userId: number }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const queryClient = useQueryClient();
  const queryKey = ['notification-permission-card', userId];

  const state = useQuery({
    queryKey,
    queryFn: async (): Promise<CardState> => ({
      permission: await getPushPermission(),
      dismissed: (await AsyncStorage.getItem(dismissedKey(userId))) === 'true',
    }),
    // Local state: fetch even offline, and re-check on every focus.
    networkMode: 'always',
    staleTime: 0,
  });

  const update = (patch: Partial<CardState>) =>
    queryClient.setQueryData<CardState>(queryKey, (old) => old && { ...old, ...patch });

  const request = useMutation({
    mutationFn: requestPushPermission,
    onSuccess: (permission) => update({ permission }),
  });

  const dismiss = useMutation({
    mutationFn: () => AsyncStorage.setItem(dismissedKey(userId), 'true'),
    onSuccess: () => update({ dismissed: true }),
  });

  const data = state.data;
  if (!data || data.permission === 'granted' || data.dismissed) return null;

  const blocked = data.permission === 'blocked';

  return (
    <View style={styles.card}>
      <AppText variant="subtitle">Ative as notificações</AppText>
      <AppText tone="muted">
        {blocked
          ? 'As notificações estão desligadas nos ajustes do aparelho. Ligue-as para receber os avisos.'
          : 'Receba avisos de preços, diagnósticos e da comunidade assim que acontecerem.'}
      </AppText>
      <View style={styles.actions}>
        <Button
          title="Agora não"
          variant="text"
          disabled={request.isPending}
          onPress={() => dismiss.mutate()}
        />
        {blocked ? (
          // Comes back with a focus refetch, which re-reads the permission.
          <Button title="Abrir ajustes" onPress={() => void Linking.openSettings()} />
        ) : (
          <Button title="Ativar" loading={request.isPending} onPress={() => request.mutate()} />
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.primaryContainer,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: theme.spacing.sm,
    },
  });
