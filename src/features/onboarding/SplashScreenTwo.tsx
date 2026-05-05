import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';

interface SplashScreenTwoProps {
  onNext: () => void;
}

export default function SplashScreenTwo({ onNext }: SplashScreenTwoProps) {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={[styles.illustration, { backgroundColor: theme.colors.onSurface }]} />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Copy, scan, and{'\n'}manage faster
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={[styles.subtitle, { color: theme.dark ? '#a1a1aa' : '#71717a' }]}>
            Scan QR codes, mask sensitive card details, and access records quickly.
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Button
          mode="contained"
          buttonColor={theme.colors.onSurface}
          textColor={theme.colors.background}
          onPress={onNext}
          style={styles.btn}
          labelStyle={styles.btnLabel}
        >
          Get Started
        </Button>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  illustration: { width: 120, height: 120, borderRadius: 32, marginBottom: 40 },
  title: { fontSize: 40, fontWeight: '900', letterSpacing: -1, marginBottom: 16 },
  subtitle: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  footer: { padding: 24, paddingBottom: 48 },
  btn: { borderRadius: 32, paddingVertical: 8 },
  btnLabel: { fontSize: 16, fontWeight: '900' },
});
