import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Animated, Image } from 'react-native';
import { Button, Text, TextInput as PaperInput, useTheme } from 'react-native-paper';
import { useUiStore } from '../../store/useUiStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const APP_ICON_PNG = require('../../../assets/app icon.png');

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
      style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 24), backgroundColor: '#111111' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        {/* Empty header or minimal */}
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Image source={APP_ICON_PNG} style={styles.largeIcon} resizeMode="contain" />
          <Text style={[styles.title, { color: '#FFFFFF' }]}>
            Welcome to My Banks
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={[styles.subtitle, { color: '#A1A1AA' }]}>
            Enter your name to personalize the app. No password, OTP, or account setup needed.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.inputContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <PaperInput
            mode="outlined"
            label="Your name"
            textColor="#FFFFFF"
            outlineColor="#3F3F46"
            activeOutlineColor="#AAEF00"
            placeholderTextColor="#71717A"
            style={{ backgroundColor: '#1A1A1A' }}
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
  container: { flex: 1, backgroundColor: '#111111' },
  header: { paddingHorizontal: 24, paddingTop: 20 },
  heroSection: { alignItems: 'center', marginBottom: 20 },
  largeIcon: { width: 120, height: 120, marginBottom: 24 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, marginTop: -20 },
  title: { fontSize: 36, fontWeight: '900', fontFamily: 'SpaceGrotesk', letterSpacing: -1, marginBottom: 16, color: '#FFFFFF', lineHeight: 42, textAlign: 'center' },
  subtitle: { fontSize: 16, lineHeight: 24, fontWeight: '500', fontFamily: 'SpaceGrotesk', color: '#A1A1AA', marginBottom: 40, textAlign: 'center' },
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
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
  },
  footer: { paddingHorizontal: 24, backgroundColor: '#111111' },
  btn: { borderRadius: 32, paddingVertical: 8, backgroundColor: '#AAEF00' },
  btnLabel: { fontSize: 18, fontWeight: '900', fontFamily: 'SpaceGrotesk', color: '#000000' },
});
