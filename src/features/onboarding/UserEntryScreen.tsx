import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useUiStore } from '../../store/useUiStore';

export default function UserEntryScreen() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const completeOnboarding = useUiStore((s) => s.completeOnboarding);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSubmit = () => {
    if (name.trim()) {
      completeOnboarding(name.trim());
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Welcome to{'\n'}My Banks
          </Text>
        </Animated.View>

        <Animated.View style={[styles.inputContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={[styles.label, { color: theme.dark ? '#a1a1aa' : '#71717a' }]}>Your name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.onSurface,
                borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Alex Morgan"
            placeholderTextColor={theme.dark ? '#71717a' : '#a1a1aa'}
            autoFocus
          />
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Button
          mode="contained"
          buttonColor={theme.colors.primary}
          textColor="#000"
          onPress={handleSubmit}
          disabled={!name.trim()}
          style={styles.btn}
          labelStyle={styles.btnLabel}
        >
          Enter App
        </Button>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 36, fontWeight: '900', letterSpacing: -1, marginBottom: 40 },
  inputContainer: { width: '100%' },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  input: {
    width: '100%',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: '700',
    borderWidth: 1,
  },
  footer: { padding: 24, paddingBottom: 48 },
  btn: { borderRadius: 32, paddingVertical: 8 },
  btnLabel: { fontSize: 16, fontWeight: '900' },
});
