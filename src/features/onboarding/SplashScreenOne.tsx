import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SplashScreenOneProps {
  onNext: () => void;
}

export default function SplashScreenOne({ onNext }: SplashScreenOneProps) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.logoText}>My Banks</Text>
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.illustrationContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Abstract geometric illustration recreating the design */}
          <View style={styles.circleBg}>
            <View style={styles.blackArch} />
            <View style={styles.peachCircle} />
            <View style={styles.peachBase} />
            <View style={styles.greenCard} />
            <View style={styles.blackCard1} />
            <View style={styles.blackCard2} />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.title}>
            Store every{'\n'}bank detail{'\n'}safely
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.subtitle}>
            Keep UPI IDs, QR codes, cards, and bank{'\n'}accounts organized on your device.
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim, paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Button
          mode="contained"
          buttonColor="#AAEF00"
          textColor="#000000"
          onPress={onNext}
          style={styles.btn}
          labelStyle={styles.btnLabel}
        >
          Continue
        </Button>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { paddingHorizontal: 24, paddingTop: 16 },
  logoText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', fontFamily: 'SpaceGrotesk', letterSpacing: -0.5 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  illustrationContainer: { alignItems: 'center', marginBottom: 48 },
  circleBg: { width: 260, height: 260, borderRadius: 130, backgroundColor: '#E3E6DC', overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end', position: 'relative' },
  blackArch: { width: 200, height: 200, borderRadius: 100, backgroundColor: '#000000', position: 'absolute', top: 40 },
  peachCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F2B8A2', position: 'absolute', bottom: 70 },
  peachBase: { width: 160, height: 100, backgroundColor: '#FADED4', position: 'absolute', bottom: -20, borderTopLeftRadius: 40, borderTopRightRadius: 40 },
  greenCard: { width: 60, height: 36, backgroundColor: '#AAEF00', borderRadius: 6, position: 'absolute', left: 40, bottom: 120, transform: [{ rotate: '-15deg' }] },
  blackCard1: { width: 90, height: 56, backgroundColor: '#000000', borderRadius: 12, position: 'absolute', bottom: 30, left: 60 },
  blackCard2: { width: 70, height: 44, backgroundColor: '#000000', borderRadius: 8, position: 'absolute', bottom: 40, right: 30, transform: [{ rotate: '15deg' }], borderWidth: 2, borderColor: '#FFFFFF' },
  title: { fontSize: 48, fontWeight: '900', fontFamily: 'SpaceGrotesk', letterSpacing: -2, marginBottom: 16, color: '#FFFFFF', lineHeight: 52 },
  subtitle: { fontSize: 16, lineHeight: 26, fontWeight: '500', fontFamily: 'SpaceGrotesk', color: '#A1A1AA' },
  footer: { paddingHorizontal: 24 },
  btn: { borderRadius: 32, paddingVertical: 8 },
  btnLabel: { fontSize: 18, fontWeight: '900', fontFamily: 'SpaceGrotesk' },
});
