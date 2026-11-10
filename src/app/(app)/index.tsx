import { useMutation } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { signOut, useSessionUser } from '@/features/auth/session-store';
import { AppText, Button, Screen } from '@/ui';

// Placeholder home: the farm list comes in step 6.
export default function Home() {
  const user = useSessionUser();
  // useMutation also fits local async actions: it gives isPending for the button.
  const logout = useMutation({ mutationFn: signOut });

  return (
    <Screen edges={['bottom']}>
      <View style={styles.content}>
        <AppText variant="subtitle">Olá, {user?.displayName || 'produtor'}</AppText>
        <AppText tone="muted">{user?.email}</AppText>
        <AppText tone="muted">A lista de fazendas entra no passo 6.</AppText>
        <Button
          title="Sair"
          variant="outlined"
          loading={logout.isPending}
          onPress={() => logout.mutate()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
});
