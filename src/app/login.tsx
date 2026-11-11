import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type TextInputInstance,
} from 'react-native';

import { useAuthenticationLogin } from '@/api/generated/endpoints/authentication/authentication';
import { signIn } from '@/features/auth/session-store';
import { AppText, Button, ErrorBanner, Screen, TextField, useTheme, type Theme } from '@/ui';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string) {
  const trimmed = email.trim();
  return {
    email: !trimmed
      ? 'Informe o e-mail'
      : !EMAIL_PATTERN.test(trimmed)
        ? 'E-mail inválido'
        : undefined,
    password: !password.trim() ? 'Informe a senha' : undefined,
  };
}

/**
 * E-mail/password login (Flutter: LoginPage + LoginBloc).
 * On success the tokens go to the session store; the root layout guard then
 * swaps this screen for the app, so there is no navigation call here.
 */
export default function Login() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const passwordRef = useRef<TextInputInstance>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Field errors show only after the first submit attempt.
  const [submitted, setSubmitted] = useState(false);

  const login = useAuthenticationLogin({
    mutation: {
      // Returning the promise keeps isPending true until the session is saved.
      onSuccess: (response) => signIn(response.data),
    },
  });

  // Derived during render: no effect and no extra state for the errors.
  const errors = validate(email, password);
  const busy = login.isPending;

  function submit() {
    setSubmitted(true);
    if (errors.email || errors.password || busy) return;
    login.mutate({
      // Same normalization as the Flutter app (accounts were created that way).
      data: { email: email.trim().toLowerCase(), password: password.trim() },
    });
  }

  function onEdit(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      // Typing again hides the previous API error.
      if (login.isError) login.reset();
    };
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <AppText variant="title" tone="primary">
              Meu Agrônomo
            </AppText>
            <AppText tone="muted">Faça login para começar</AppText>
          </View>

          <TextField
            label="E-mail"
            value={email}
            onChangeText={onEdit(setEmail)}
            error={submitted ? errors.email : undefined}
            placeholder="voce@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => passwordRef.current?.focus()}
            editable={!busy}
          />
          <TextField
            ref={passwordRef}
            label="Senha"
            value={password}
            onChangeText={onEdit(setPassword)}
            error={submitted ? errors.password : undefined}
            placeholder="Digite sua senha"
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
            editable={!busy}
          />

          {login.error ? <ErrorBanner message={login.error.message} /> : null}

          <Button title="Entrar" onPress={submit} loading={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.xl,
    },
    header: {
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.lg,
    },
  });
