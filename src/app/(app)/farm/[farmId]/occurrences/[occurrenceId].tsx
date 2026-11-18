import { Stack, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import type { OccurrenceDto } from '@/api/generated/model';
import { OccurrencePhotoThumb } from '@/features/occurrences/occurrence-photo-thumb';
import {
  formatBrDate,
  severityLabel,
  statusLabel,
  typeLabel,
} from '@/features/occurrences/occurrence-form-values';
import {
  useAddOccurrencePhoto,
  useOccurrence,
  useOccurrencePhotos,
} from '@/features/occurrences/use-occurrences';
import { AppText, Button, Chip, ErrorBanner, QueryState, Screen, useTheme, type Theme } from '@/ui';

/** Occurrence and its photos (Flutter: OccurrenceDetailPage). */
export default function OccurrenceDetailScreen() {
  const { farmId, occurrenceId } = useLocalSearchParams<{
    farmId: string;
    occurrenceId: string;
  }>();
  const occurrence = useOccurrence(Number(occurrenceId));

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'Ocorrência' }} />
      <QueryState query={occurrence}>
        {(data) => <OccurrenceDetail occurrence={data} farmId={Number(farmId)} />}
      </QueryState>
    </Screen>
  );
}

function OccurrenceDetail({ occurrence, farmId }: { occurrence: OccurrenceDto; farmId: number }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const photos = useOccurrencePhotos(occurrence.id);
  const addPhoto = useAddOccurrencePhoto(farmId, occurrence.id);

  function choosePhotoSource() {
    addPhoto.reset();
    // Three buttons is the most an Android alert can show.
    Alert.alert('Adicionar foto', undefined, [
      { text: 'Tirar foto', onPress: () => addPhoto.mutate('camera') },
      { text: 'Galeria', onPress: () => addPhoto.mutate('gallery') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <ScrollView
      // Starts below the translucent iOS header (see the fields list).
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
    >
      <AppText variant="title">{occurrence.title}</AppText>

      <View style={styles.chips}>
        <Chip label={typeLabel[occurrence.type]} tone="primary" />
        <Chip label={`Gravidade ${severityLabel[occurrence.severity].toLowerCase()}`} />
        <Chip label={statusLabel[occurrence.status]} />
        <Chip label={formatBrDate(occurrence.occurredAt)} />
        {occurrence.field ? <Chip label={occurrence.field.name} /> : null}
      </View>

      {occurrence.description ? <AppText>{occurrence.description}</AppText> : null}

      <AppText variant="subtitle">Fotos</AppText>

      {photos.isError ? (
        <>
          <ErrorBanner message={photos.error.message} />
          <Button title="Tentar de novo" variant="text" onPress={() => void photos.refetch()} />
        </>
      ) : photos.data?.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.photos}>
            {photos.data.map((media) => (
              <OccurrencePhotoThumb key={media.id} media={media} />
            ))}
          </View>
        </ScrollView>
      ) : photos.data ? (
        <AppText tone="muted">
          Nenhuma foto ainda. Fotografe a planta ou o animal de perto e com boa luz.
        </AppText>
      ) : null}

      {addPhoto.error ? <ErrorBanner message={addPhoto.error.message} /> : null}

      <Button
        title="Adicionar foto"
        variant="outlined"
        loading={addPhoto.isPending}
        onPress={choosePhotoSource}
      />
    </ScrollView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    content: {
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.lg,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    photos: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
  });
