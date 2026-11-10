import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, type TextInputInstance, View } from 'react-native';

import { AppText, Button, Screen, TextField, useTheme, type Theme } from '@/ui';

// Temporary component showcase (step 1). Replaced by the farm list (home)
// once auth is in place.
export default function Index() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const passwordRef = useRef<TextInputInstance>(null);
  const [loading, setLoading] = useState(false);

  function simulateSave() {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppText variant="title">Agrônomo RN</AppText>
        <AppText tone="muted">Vitrine dos componentes base ({theme.scheme})</AppText>

        <View style={styles.section}>
          <AppText variant="subtitle">Textos</AppText>
          <AppText variant="body">Body: texto padrão</AppText>
          <AppText variant="label" tone="primary">
            Label primary
          </AppText>
          <AppText variant="caption" tone="error">
            Caption error
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="subtitle">Campos</AppText>
          <TextField
            label="E-mail"
            placeholder="voce@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <TextField
            ref={passwordRef}
            label="Senha"
            placeholder="Digite sua senha"
            secureTextEntry
            autoComplete="current-password"
            returnKeyType="done"
          />
          <TextField label="Nome da fazenda" error="Informe o nome" />
        </View>

        <View style={styles.section}>
          <AppText variant="subtitle">Botões</AppText>
          <Button title="Salvar" onPress={simulateSave} loading={loading} />
          <Button title="Cancelar" variant="outlined" onPress={() => {}} />
          <Button title="Esqueci a senha" variant="text" onPress={() => {}} />
          <Button title="Desabilitado" onPress={() => {}} disabled />
        </View>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    content: {
      gap: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
    },
    section: {
      gap: theme.spacing.md,
    },
  });
