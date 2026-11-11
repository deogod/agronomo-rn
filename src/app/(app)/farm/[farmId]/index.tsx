import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { areaLabel, farmTypeLabel, locationLabel } from '@/features/farms/labels';
import { useMyFarm } from '@/features/farms/use-my-farms';
import { AppText, QueryState, Screen, useTheme, type Theme } from '@/ui';

/**
 * Placeholder farm panel: the fields list comes in step 7.
 * The route carries only the id; the farm is read from the cached list.
 */
export default function FarmScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  // Route params are always strings (they come from a URL).
  const { farmId } = useLocalSearchParams<{ farmId: string }>();
  const farm = useMyFarm(Number(farmId));

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: farm.data?.farm.name ?? '' }} />
      <QueryState query={farm}>
        {(member) =>
          member ? (
            <View style={styles.content}>
              <AppText variant="title">{member.farm.name}</AppText>
              <AppText tone="muted">
                {[
                  farmTypeLabel[member.farm.type],
                  locationLabel(member),
                  areaLabel(member.farm.totalAreaHa),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </AppText>
              <AppText tone="muted">Os talhões entram no passo 7.</AppText>
            </View>
          ) : (
            <View style={styles.content}>
              <AppText variant="subtitle">Lugar não encontrado</AppText>
              <AppText tone="muted">
                Você não faz mais parte deste lugar ou ele foi removido.
              </AppText>
            </View>
          )
        }
      </QueryState>
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    content: {
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.lg,
    },
  });
