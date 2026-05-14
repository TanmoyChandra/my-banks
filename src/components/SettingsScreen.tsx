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
import { Text, useTheme, List, Surface, IconButton, Avatar, Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUiStore } from '../store/useUiStore';
import { useEffect, useRef } from 'react';

interface SettingsScreenProps {
  onNavigate: (screen: 'setup-qr' | 'setup-cards' | 'setup-accounts' | 'setup-merchant-qr') => void;
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

  const bgColor = theme.colors.background;
  const surfaceColor = theme.colors.surfaceVariant;
  const textColor = theme.colors.onSurface;
  const subColor = theme.colors.onSurfaceVariant;
  const borderColor = theme.colors.outlineVariant;
  const toggleTheme = useUiStore(s => s.toggleTheme);

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
            <Avatar.Text 
              size={40} 
              label={userName ? userName.charAt(0).toUpperCase() : '?'} 
              style={{ backgroundColor: theme.colors.primaryContainer }} 
              labelStyle={{ color: theme.colors.onPrimaryContainer, fontWeight: '700' }}
            />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
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

        {/* App info */}
        <View style={[styles.infoBox, { backgroundColor: surfaceColor, borderColor }]}>
          <Text style={[styles.infoTitle, { color: textColor }]}>MyBanks</Text>
          <Text style={[styles.infoText, { color: subColor }]}>
            All data is stored locally on your device.{'\n'}No accounts, no cloud, no tracking.
          </Text>
          <Text style={[styles.infoVersion, { color: subColor }]}>v1.0.0</Text>
        </View>

        <Text style={[styles.footerText, { color: subColor }]}>
          Made with ❤️ by Tanmoy Chandra
        </Text>
      </ScrollView>
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
});
