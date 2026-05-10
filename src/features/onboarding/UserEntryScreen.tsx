import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { Button, Text, TextInput as PaperInput, useTheme } from 'react-native-paper';
import { useUiStore } from '../../store/useUiStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function UserEntryScreen() {
  const [name, setName] = useState('');
  const completeOnboarding = useUiStore((s) => s.completeOnboarding);
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSubmit = () => {
    if (name.trim()) {
      completeOnboarding(name.trim());
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 24), backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
          <Icon name="bank" size={24} color={theme.colors.onPrimaryContainer} />
        </View>
      </View>

      <View style={styles.content}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Welcome to My{'\n'}Banks
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Enter your name to personalize the app. No{'\n'}password, OTP, or account setup needed.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.inputContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <PaperInput
            mode="outlined"
            label="Your name"
            style={{ backgroundColor: theme.colors.surfaceVariant }}
            value={name}
            onChangeText={setName}
            placeholder="Alex Morgan"
            autoFocus
          />
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Button
          mode="contained"
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}
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
  container: { flex: 1, backgroundColor: '#000000' },
  header: { paddingHorizontal: 24, paddingTop: 40 },
  iconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#AAEF00', alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, marginTop: -40 },
  title: { fontSize: 40, fontWeight: '900', fontFamily: 'SpaceGrotesk', letterSpacing: -1.5, marginBottom: 16, color: '#FFFFFF', lineHeight: 44 },
  subtitle: { fontSize: 16, lineHeight: 26, fontWeight: '500', fontFamily: 'SpaceGrotesk', color: '#A1A1AA', marginBottom: 40 },
  inputContainer: { width: '100%' },
  label: { fontSize: 14, fontWeight: '800', fontFamily: 'SpaceGrotesk', marginBottom: 12, color: '#FFFFFF' },
  input: {
    width: '100%',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk',
    backgroundColor: '#18181B',
    color: '#FFFFFF',
  },
  footer: { paddingHorizontal: 24 },
  btn: { borderRadius: 32, paddingVertical: 8 },
  btnLabel: { fontSize: 18, fontWeight: '900', fontFamily: 'SpaceGrotesk' },
});
