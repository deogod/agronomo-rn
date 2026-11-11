import { StyleSheet, View } from 'react-native';

import { AppText } from './app-text';
import { useTheme } from './use-theme';

type ChipProps = {
  label: string;
  tone?: 'primary' | 'neutral';
};

/** Small pill label (Flutter: _PillChip in the farm card). */
export function Chip({ label, tone = 'neutral' }: ChipProps) {
  const { colors, radius, spacing } = useTheme();
  const background = tone === 'primary' ? colors.primaryContainer : colors.secondaryContainer;
  const foreground = tone === 'primary' ? colors.onPrimaryContainer : colors.onSecondaryContainer;

  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: background, borderRadius: radius.full, paddingHorizontal: spacing.sm },
      ]}
    >
      <AppText variant="caption" style={{ color: foreground }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
});
