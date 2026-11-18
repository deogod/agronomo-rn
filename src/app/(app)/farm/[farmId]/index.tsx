import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { areaLabel, farmTypeLabel, locationLabel } from '@/features/farms/labels';
import { useMyFarm } from '@/features/farms/use-my-farms';
import { AppText, Button, QueryState, Screen, useTheme, type Theme } from '@/ui';

/**
 * Farm panel (Flutter: FarmPage, reduced to the fields entry for this port).
 * The route carries only the id; the farm is read from the cached list.
 */
export default function FarmScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  // Route params are always strings (they come from a URL).
  const { farmId } = useLocalSearchParams<{ farmId: string }>();
  const farm = useMyFarm(Number(farmId));

  // ScrollView with contentInsetAdjustmentBehavior: on iOS 26+ the header floats
  // over the screen, and only a scroll view can push its content below it.
  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: farm.data?.farm.name ?? '' }} />
      <QueryState query={farm}>
        {(member) =>
          member ? (
            <ScrollView
              contentInsetAdjustmentBehavior="automatic"
              contentContainerStyle={styles.content}
            >
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
              {member.farm.type === 'FARM' ? (
                <Button
                  title="Talhões"
                  variant="outlined"
                  onPress={() =>
                    router.push({
                      pathname: '/farm/[farmId]/fields',
                      params: { farmId: member.farm.id },
                    })
                  }
                />
              ) : (
                // Same rule as the API: a home has no fields or hectares.
                <AppText tone="muted">Casas não têm talhões.</AppText>
              )}
              <Button
                title="Ocorrências"
                variant="outlined"
                onPress={() =>
                  router.push({
                    pathname: '/farm/[farmId]/occurrences',
                    params: { farmId: member.farm.id },
                  })
                }
              />
            </ScrollView>
          ) : (
            <ScrollView
              contentInsetAdjustmentBehavior="automatic"
              contentContainerStyle={styles.content}
            >
              <AppText variant="subtitle">Lugar não encontrado</AppText>
              <AppText tone="muted">
                Você não faz mais parte deste lugar ou ele foi removido.
              </AppText>
            </ScrollView>
          )
        }
      </QueryState>
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    content: {
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.lg,
    },
  });
