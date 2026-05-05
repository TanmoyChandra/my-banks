import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SplashScreenTwoProps {
  onNext: () => void;
}

export default function SplashScreenTwo({ onNext }: SplashScreenTwoProps) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.logoText}>My Banks</Text>
        <TouchableOpacity style={styles.skipBtn} onPress={onNext} activeOpacity={0.8}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.illustrationContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.blackBlob}>
             <View style={styles.whiteCard} />
             <View style={styles.grayCard} />
             <View style={styles.greenDash1} />
             <View style={styles.greenDash2} />
             <View style={styles.blobTail} />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.title}>
            Copy, scan,{'\n'}and manage{'\n'}faster
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.subtitle}>
            Scan QR codes, mask sensitive card details,{'\n'}and access records with clean bottom{'\n'}navigation.
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim, paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Button
          mode="contained"
          buttonColor="#000000"
          textColor="#FFFFFF"
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
  container: { flex: 1, backgroundColor: '#BEF264' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16 },
  logoText: { color: '#000000', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  skipBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  skipText: { color: '#000000', fontSize: 14, fontWeight: '800' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  illustrationContainer: { alignItems: 'center', marginBottom: 48 },
  blackBlob: { width: 260, height: 260, borderRadius: 130, backgroundColor: '#000000', position: 'relative' },
  blobTail: { width: 40, height: 40, backgroundColor: '#000000', position: 'absolute', bottom: 20, left: 10, borderBottomLeftRadius: 10, transform: [{ rotate: '45deg' }] },
  whiteCard: { width: 50, height: 40, backgroundColor: '#FFFFFF', borderRadius: 8, position: 'absolute', top: 40, right: 50, transform: [{ rotate: '15deg' }] },
  grayCard: { width: 45, height: 35, backgroundColor: '#A1A1AA', borderRadius: 8, position: 'absolute', bottom: 80, left: 60, transform: [{ rotate: '-10deg' }] },
  greenDash1: { width: 30, height: 8, backgroundColor: '#BEF264', borderRadius: 4, position: 'absolute', bottom: 60, left: 70, transform: [{ rotate: '-10deg' }] },
  greenDash2: { width: 20, height: 8, backgroundColor: '#BEF264', borderRadius: 4, position: 'absolute', bottom: 55, left: 105, transform: [{ rotate: '-10deg' }] },
  title: { fontSize: 48, fontWeight: '900', letterSpacing: -2, marginBottom: 16, color: '#000000', lineHeight: 48 },
  subtitle: { fontSize: 16, lineHeight: 24, fontWeight: '500', color: '#3F3F46' },
  footer: { paddingHorizontal: 24 },
  btn: { borderRadius: 32, paddingVertical: 8 },
  btnLabel: { fontSize: 18, fontWeight: '900' },
});
