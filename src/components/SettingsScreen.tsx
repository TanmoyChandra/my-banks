import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  LayoutAnimation,
  Animated,
} from 'react-native';
import { Text, useTheme, List, Surface, IconButton, Avatar, Icon, Switch, Portal, Dialog, TextInput, Button } from 'react-native-paper';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUiStore } from '../store/useUiStore';
import { useEffect, useRef, useState } from 'react';

interface SettingsScreenProps {
  onNavigate: (screen: 'setup-qr' | 'setup-cards' | 'setup-accounts' | 'setup-merchant-qr' | 'setup-backup') => void;
}

interface SetupCardProps {
  icon: string;
  title: string;
  subtitle: string;
  accentColor: string;
  onPress: () => void;
  isDark: boolean;
  bgColor: string;
  borderColor: string;
  textColor: string;
  subColor: string;
}

function SetupCard({
  icon, title, subtitle, accentColor, onPress,
  isDark, bgColor, borderColor, textColor, subColor,
}: SetupCardProps) {
  return (
    <Surface elevation={0} style={{ borderRadius: 16, marginBottom: 12, overflow: 'hidden', backgroundColor: bgColor }}>
      <List.Item
        title={title}
        description={subtitle}
        onPress={onPress}
        left={(props) => (
          <View style={[styles.cardIconBox, { backgroundColor: accentColor, marginLeft: 16, marginRight: 8, marginTop: 8 }]}>
            <List.Icon icon={icon} color="#000000" style={{ margin: 0 }} />
          </View>
        )}
        right={(props) => <List.Icon {...props} icon="chevron-right" color={subColor} />}
        titleStyle={[styles.cardTitle, { color: textColor }]}
        descriptionStyle={[styles.cardSubtitle, { color: subColor }]}
        style={{ backgroundColor: 'transparent' }}
      />
    </Surface>
  );
}

export default function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const theme = useTheme();
  const isDark = theme.dark;
  const insets = useSafeAreaInsets();
  const userName = useUiStore(s => s.userName);
  const userImage = useUiStore(s => s.userImage);
  const setUserName = useUiStore(s => s.setUserName);
  const setUserImage = useUiStore(s => s.setUserImage);

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const bgColor = theme.colors.background;
  const surfaceColor = theme.colors.surfaceVariant;
  const textColor = theme.colors.onSurface;
  const subColor = theme.colors.onSurfaceVariant;
  const borderColor = theme.colors.outlineVariant;
  const toggleTheme = useUiStore(s => s.toggleTheme);
  const isAppLockEnabled = useUiStore(s => s.isAppLockEnabled);
  const setAppLockEnabled = useUiStore(s => s.setAppLockEnabled);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setUserImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSaveProfile = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      setProfileModalVisible(false);
    }
  };

  const toggleAppLock = async () => {
    if (isAppLockEnabled) {
      setAppLockEnabled(false);
    } else {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        alert("Your device doesn't support or have biometrics/PIN setup.");
        return;
      }
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable App Lock',
      });
      if (result.success) {
        setAppLockEnabled(true);
      } else {
        alert(`Authentication failed: ${result.error || 'Unknown error'}`);
      }
    }
  };

  const rotateAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isDark ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isDark]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={[styles.screen, { backgroundColor: bgColor, paddingTop: insets.top + 16 }]}>
      {/* Page header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={[styles.pageTitle, { color: textColor }]}>Settings</Text>
            {userName ? (
              <Text style={[styles.pageSubtitle, { color: subColor }]}>
                Hi, {userName}
              </Text>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <IconButton
                icon={isDark ? 'weather-sunny' : 'moon-waning-crescent'}
                size={24}
                iconColor={isDark ? '#000000' : '#FFFFFF'}
                style={{ backgroundColor: isDark ? '#AAEF00' : '#1c1c1c', margin: 0 }}
                onPress={() => {
                  toggleTheme();
                }}
              />
            </Animated.View>
            <TouchableOpacity onPress={() => { setTempName(userName); setProfileModalVisible(true); }}>
              {userImage ? (
                <Avatar.Image size={40} source={{ uri: userImage }} />
              ) : (
                <Avatar.Text 
                  size={40} 
                  label={userName ? userName.charAt(0).toUpperCase() : '?'} 
                  style={{ backgroundColor: theme.colors.primaryContainer }} 
                  labelStyle={{ color: theme.colors.onPrimaryContainer, fontWeight: '700' }}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: subColor }]}>PROFILE</Text>
        <SetupCard
          icon="account-edit"
          title="Profile"
          subtitle="Update your name and profile picture"
          accentColor="#AAEF00"
          onPress={() => { setTempName(userName); setProfileModalVisible(true); }}
          isDark={isDark}
          bgColor={surfaceColor}
          borderColor={borderColor}
          textColor={textColor}
          subColor={subColor}
        />

        <Text style={[styles.sectionLabel, { color: subColor }]}>DATA SETUP</Text>

        <SetupCard
          icon="qrcode"
          title="UPI / QR Codes"
          subtitle="Add and manage your UPI IDs and QR codes"
          accentColor="#AAEF00"
          onPress={() => onNavigate('setup-qr')}
          isDark={isDark}
          bgColor={surfaceColor}
          borderColor={borderColor}
          textColor={textColor}
          subColor={subColor}
        />

        <SetupCard
          icon="credit-card"
          title="Debit / Credit Cards"
          subtitle="Save card numbers, expiry dates and CVV"
          accentColor="#AAEF00"
          onPress={() => onNavigate('setup-cards')}
          isDark={isDark}
          bgColor={surfaceColor}
          borderColor={borderColor}
          textColor={textColor}
          subColor={subColor}
        />

        <SetupCard
          icon="store"
          title="Merchant QR Codes"
          subtitle="Add frequently-used merchant QR codes from your gallery"
          accentColor="#AAEF00"
          onPress={() => onNavigate('setup-merchant-qr')}
          isDark={isDark}
          bgColor={surfaceColor}
          borderColor={borderColor}
          textColor={textColor}
          subColor={subColor}
        />

        <SetupCard
          icon="bank"
          title="Bank Accounts"
          subtitle="Store IFSC, account number and branch details"
          accentColor="#AAEF00"
          onPress={() => onNavigate('setup-accounts')}
          isDark={isDark}
          bgColor={surfaceColor}
          borderColor={borderColor}
          textColor={textColor}
          subColor={subColor}
        />

        <Text style={[styles.sectionLabel, { color: subColor, marginTop: 8 }]}>BACKUP & RESTORE</Text>

        <SetupCard
          icon="database-export"
          title="Export / Import Data"
          subtitle="Save an encrypted backup or restore all your data"
          accentColor="#AAEF00"
          onPress={() => onNavigate('setup-backup')}
          isDark={isDark}
          bgColor={surfaceColor}
          borderColor={borderColor}
          textColor={textColor}
          subColor={subColor}
        />

        <Text style={[styles.sectionLabel, { color: subColor, marginTop: 8 }]}>SECURITY</Text>

        <Surface elevation={0} style={{ borderRadius: 16, marginBottom: 12, overflow: 'hidden', backgroundColor: surfaceColor }}>
          <List.Item
            title="App Lock"
            description="Require fingerprint or PIN to open"
            left={(props) => (
              <View style={[styles.cardIconBox, { backgroundColor: '#AAEF00', marginLeft: 16, marginRight: 8, marginTop: 8 }]}>
                <List.Icon icon="fingerprint" color="#000000" style={{ margin: 0 }} />
              </View>
            )}
            right={() => (
              <View style={{ justifyContent: 'center', paddingRight: 16 }}>
                <Switch value={isAppLockEnabled} onValueChange={toggleAppLock} color="#AAEF00" />
              </View>
            )}
            titleStyle={[styles.cardTitle, { color: textColor }]}
            descriptionStyle={[styles.cardSubtitle, { color: subColor }]}
            style={{ backgroundColor: 'transparent' }}
          />
        </Surface>

        {/* Combined Security & App Info Card — Neutral Design */}
        <Surface elevation={0} style={[styles.safetyBadge, { backgroundColor: surfaceColor, borderColor, marginTop: 24 }]}>
          <View style={styles.safetyHeader}>
            <Text style={[styles.safetyTitle, { color: textColor }]}>MyBanks Security</Text>
          </View>

          <Text style={[styles.safetyText, { color: textColor }]}>
            Your data is <Text style={{ fontWeight: 'bold' }}>100% unbreakable</Text>. All information is encrypted and stored locally on your mobile phone for ultimate privacy.
          </Text>
          
          <Text style={[styles.safetyDescription, { color: subColor }]}>
            No accounts, no trackers, no cloud sync. Everything stays on your device, exactly where it belongs.
          </Text>

          <View style={styles.safetyFeatures}>
            <View style={styles.safetyFeatureItem}>
              <Icon source="cloud-off" size={16} color={subColor} />
              <Text style={[styles.safetyFeatureText, { color: subColor }]}>Offline Only</Text>
            </View>
            <View style={styles.safetyFeatureItem}>
              <Icon source="lock-check" size={16} color={subColor} />
              <Text style={[styles.safetyFeatureText, { color: subColor }]}>AES-XOR</Text>
            </View>
            <View style={styles.safetyFeatureItem}>
              <Icon source="fingerprint" size={16} color={subColor} />
              <Text style={[styles.safetyFeatureText, { color: subColor }]}>Biometric</Text>
            </View>
          </View>

        </Surface>
        
        <Text style={[styles.footerText, { color: subColor, marginTop: 12 }]}>
          Made with ❤️ by Tanmoy Chandra
        </Text>

        <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 8 }}>
          <Text style={[styles.infoVersion, { color: subColor, fontSize: 11, opacity: 0.4 }]}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Profile Modal */}
      <Portal>
        <Dialog visible={profileModalVisible} onDismiss={() => setProfileModalVisible(false)} style={{ backgroundColor: theme.colors.surface }}>
          <Dialog.Title style={{ color: textColor }}>Edit Profile</Dialog.Title>
          <Dialog.Content>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity onPress={pickImage}>
                {userImage ? (
                  <Avatar.Image size={100} source={{ uri: userImage }} />
                ) : (
                  <Avatar.Icon size={100} icon="account" style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.onPrimaryContainer} />
                )}
                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#AAEF00', borderRadius: 15, padding: 4 }}>
                  <Icon source="camera" size={20} color="#000" />
                </View>
              </TouchableOpacity>
              <Text style={{ marginTop: 8, color: subColor, fontSize: 12 }}>Tap to change picture</Text>
            </View>

            <TextInput
              label="Your Name"
              value={tempName}
              onChangeText={setTempName}
              mode="outlined"
              style={{ backgroundColor: 'transparent' }}
              textColor={textColor}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setProfileModalVisible(false)} textColor={subColor}>Cancel</Button>
            <Button onPress={handleSaveProfile} textColor="#AAEF00">Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  pageTitle: { fontSize: 28, fontWeight: '700', marginBottom: 6, fontFamily: 'SpaceGrotesk', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 14, fontFamily: 'SpaceGrotesk', lineHeight: 20 },

  content: {
    paddingHorizontal: 20,
  },

  sectionLabel: {
    fontSize: 11,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 4,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    fontSize: 24,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'SpaceGrotesk',
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk',
    lineHeight: 18,
  },
  cardChevron: {
    fontSize: 24,
    fontWeight: '300',
    marginRight: 4,
  },

  infoBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginTop: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'SpaceGrotesk',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoVersion: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk',
    opacity: 0.5,
  },

  footerText: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk',
    textAlign: 'center',
    opacity: 0.5,
    marginBottom: 8,
  },
  safetyBadge: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 24,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'SpaceGrotesk',
  },
  safetySubtitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk',
    marginTop: -2,
  },
  safetyText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk',
    lineHeight: 22,
    marginBottom: 8,
    opacity: 0.9,
    marginTop: 16,
  },
  safetyDescription: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk',
    lineHeight: 18,
    marginBottom: 20,
    opacity: 0.7,
  },
  safetyFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.15)',
  },
  safetyFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  safetyFeatureText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk',
  },
  infoVersion: {
    fontSize: 10,
    fontFamily: 'SpaceGrotesk',
    opacity: 0.5,
  },
});
