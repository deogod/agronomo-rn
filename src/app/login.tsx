import { StyleSheet, View } from 'react-native';

import { AppText, Screen } from '@/ui';

// Placeholder: the e-mail/password form comes in step 5.
export default function Login() {
  return (
    <Screen>
      <View style={styles.content}>
        <AppText variant="title">Entrar</AppText>
        <AppText tone="muted">O formulário de login entra no passo 5.</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
});
