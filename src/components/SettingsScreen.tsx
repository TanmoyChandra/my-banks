import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Text, useTheme, List, Surface } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUiStore } from '../store/useUiStore';

interface SettingsScreenProps {
  onNavigate: (screen: 'setup-qr' | 'setup-cards' | 'setup-accounts') => void;
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
    <Surface elevation={1} style={{ borderRadius: 16, marginBottom: 12, overflow: 'hidden' }}>
      <List.Item
        title={title}
        description={subtitle}
        onPress={onPress}
        left={(props) => (
          <View style={[styles.cardIconBox, { backgroundColor: accentColor, marginLeft: 16, marginRight: 8, marginTop: 8 }]}>
            <Text style={styles.cardIconText}>{icon}</Text>
          </View>
        )}
        right={(props) => <List.Icon {...props} icon="chevron-right" color={subColor} />}
        titleStyle={[styles.cardTitle, { color: textColor }]}
        descriptionStyle={[styles.cardSubtitle, { color: subColor }]}
        style={{ backgroundColor: bgColor }}
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

  return (
    <View style={[styles.screen, { backgroundColor: bgColor, paddingTop: insets.top }]}>
      {/* Page header */}
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: textColor }]}>Settings</Text>
        {userName ? (
          <Text style={[styles.pageSubtitle, { color: subColor }]}>
            Hi, {userName} 👋
          </Text>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: subColor }]}>DATA SETUP</Text>

        <SetupCard
          icon="📷"
          title="UPI / QR Codes"
          subtitle="Add and manage your UPI IDs and QR codes"
          accentColor={theme.colors.primaryContainer}
          onPress={() => onNavigate('setup-qr')}
          isDark={isDark}
          bgColor={surfaceColor}
          borderColor={borderColor}
          textColor={textColor}
          subColor={subColor}
        />

        <SetupCard
          icon="🏦"
          title="Bank Accounts"
          subtitle="Store IFSC, account number and branch details"
          accentColor={theme.colors.secondaryContainer}
          onPress={() => onNavigate('setup-accounts')}
          isDark={isDark}
          bgColor={surfaceColor}
          borderColor={borderColor}
          textColor={textColor}
          subColor={subColor}
        />

        <SetupCard
          icon="💳"
          title="Debit / Credit Cards"
          subtitle="Save card numbers, expiry dates and CVV"
          accentColor={theme.colors.tertiaryContainer}
          onPress={() => onNavigate('setup-cards')}
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
  pageTitle: {
    fontSize: 34,
    fontWeight: '900',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    letterSpacing: -1,
  },
  pageSubtitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 4,
  },

  content: {
    paddingHorizontal: 20,
  },

  sectionLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
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
    fontFamily: 'PlusJakartaSans-ExtraBold',
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
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
    fontFamily: 'PlusJakartaSans-ExtraBold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoVersion: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    opacity: 0.5,
  },

  footerText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    textAlign: 'center',
    opacity: 0.5,
    marginBottom: 8,
  },
});
