import { StyleSheet, Text, View } from 'react-native';

// Temporary screen: replaced by the farm list (home) once auth is in place.
export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agrônomo RN</Text>
      <Text style={styles.subtitle}>Passo 0: projeto criado</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#2E5E4E',
  },
  subtitle: {
    fontSize: 16,
    color: '#444746',
  },
});
