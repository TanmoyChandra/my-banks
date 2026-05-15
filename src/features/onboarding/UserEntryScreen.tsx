import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Animated, Image } from 'react-native';
import { Button, Text, TextInput as PaperInput, useTheme, Avatar } from 'react-native-paper';
import { useUiStore } from '../../store/useUiStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableOpacity } from 'react-native-gesture-handler';

const APP_ICON_PNG = require('../../../assets/app-icon.png');

export default function UserEntryScreen() {
  const [name, setName] = useState('');
  const [image, setImage] = useState<string | undefined>();
  const completeOnboarding = useUiStore((s) => s.completeOnboarding);
  const setUserImage = useUiStore((s) => s.setUserImage);
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
      if (image) setUserImage(image);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
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
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
            {image ? (
              <Avatar.Image size={100} source={{ uri: image }} />
            ) : (
              <View style={styles.placeholderIcon}>
                <Image source={APP_ICON_PNG} style={styles.largeIcon} resizeMode="contain" />
                <View style={styles.addBadge}>
                  <Icon name="camera-plus" size={16} color="#000" />
                </View>
              </View>
            )}
          </TouchableOpacity>
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
  imagePicker: { marginBottom: 12 },
  placeholderIcon: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  largeIcon: { width: 120, height: 120 },
  addBadge: { position: 'absolute', bottom: 10, right: 10, backgroundColor: '#AAEF00', borderRadius: 12, padding: 4, borderWidth: 2, borderColor: '#111111' },
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
