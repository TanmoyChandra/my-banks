import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Share, Image, Animated, Platform, UIManager } from 'react-native';
import { Text, useTheme, IconButton, Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { BankAccount } from '../types';
import { findBankByName } from '../constants/banks';
import { useUiStore } from '../store/useUiStore';
import { getCardColors } from '../constants/cardColors';
import EmptyState from './EmptyState';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface BankAccountsSectionProps {
  accounts: BankAccount[];
}

const AccountItem: React.FC<{ account: BankAccount }> = ({ account }) => {
  const [expanded, setExpanded] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;
  const theme = useTheme();
  const bank = findBankByName(account.bankName);

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: expanded ? 1 : 0,
      duration: 320,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  const expandedOpacity = animValue;
  const expandedTranslate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });
  const collapsedOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const palette = getCardColors(account.color);
  const cardBg = palette.via;
  const textColor = '#FFFFFF';
  const mutedColor = 'rgba(255,255,255,0.55)';
  const accentColor = '#C9F158';



  const handleCopy = async (text: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
  };

  const handleShare = async () => {
    const message = `Bank Account Details\nBank: ${account.bankName}\nHolder: ${account.accountHolder}\nA/C: ${account.accountNumber}\nIFSC: ${account.ifsc}\nType: ${account.accountType}\nBranch: ${account.branchName}`;
    try { await Share.share({ message }); } catch {}
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
    onPress={() => setExpanded(!expanded)}
      style={styles.cardWrapper}
    >
      <View style={[styles.accountCard, { backgroundColor: cardBg }]}>
        {/* Decorative circles */}
        <View style={styles.decoCircle1} />
        <View style={styles.decoCircle2} />

        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.bankIconBox}>
            {bank ? (
              <Image source={bank.symbol} style={styles.bankLogo} resizeMode="contain" />
            ) : (
              <Text style={styles.bankInitials}>{account.bankName.slice(0, 2).toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.bankTitle, { color: textColor }]}>{account.bankName}</Text>
            <View style={styles.accountTypeBadge}>
              <Text style={styles.accountTypeBadgeText}>{account.accountType.toUpperCase()} ACCOUNT</Text>
            </View>
          </View>
          <IconButton icon="share-variant" size={18} iconColor={mutedColor} onPress={handleShare} style={{ margin: 0 }} />
        </View>

        {/* Collapsed: masked account number */}
        <Animated.View style={{
          opacity: collapsedOpacity,
          maxHeight: animValue.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }),
          marginTop: animValue.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
          overflow: 'hidden',
        }}>
          <Text style={[styles.infoLabel, { color: mutedColor }]}>Account Number</Text>
          <Text style={[styles.accountNumber, { color: textColor }]} numberOfLines={1}>{account.accountNumber}</Text>
        </Animated.View>

        {/* Expanded: all details */}
        <Animated.View
          style={{
            opacity: expandedOpacity,
            transform: [{ translateY: expandedTranslate }],
            overflow: 'hidden',
            maxHeight: animValue.interpolate({ inputRange: [0, 1], outputRange: [0, 400] }),
          }}
        >
          <View style={styles.expandedContent}>
            <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />

            <TouchableOpacity onPress={() => handleCopy(account.accountHolder)} style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: mutedColor }]}>ACCOUNT HOLDER</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>{account.accountHolder || 'Not provided'}</Text>
            </TouchableOpacity>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: mutedColor }]}>ACCOUNT NUMBER</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => handleCopy(account.accountNumber)} style={{ flex: 1 }}>
                  <Text style={[styles.infoValue, { color: textColor }]}>{account.accountNumber}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={() => handleCopy(account.ifsc)} style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: mutedColor }]}>IFSC CODE</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>{account.ifsc?.toUpperCase() || 'Not provided'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleCopy(account.branchName)} style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: mutedColor }]}>BRANCH</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>{account.branchName || 'Not provided'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

const BankAccountsSection: React.FC<BankAccountsSectionProps> = ({ accounts }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const userName = useUiStore(s => s.userName);
  const initials = userName ? userName.charAt(0).toUpperCase() : '?';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.sectionIntro}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={[styles.introTitle, { color: theme.colors.onSurface }]}>Bank accounts</Text>
            <Text style={[styles.introText, { color: theme.dark ? '#a1a1aa' : '#52525b' }]}>
              Keep IFSC and account details easy to find.
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Avatar.Text
              size={40}
              label={initials}
              style={{ backgroundColor: theme.colors.primaryContainer }}
              labelStyle={{ color: theme.colors.onPrimaryContainer, fontWeight: '700' }}
            />
          </TouchableOpacity>
        </View>
      </View>

      {accounts.length === 0 ? (
        <EmptyState icon="bank-outline" message="Go to settings to add a new bank account" />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {accounts.map(acc => <AccountItem key={acc.id} account={acc} />)}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionIntro: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 },
  introTitle: { fontSize: 28, fontWeight: '700', marginBottom: 6, fontFamily: 'SpaceGrotesk', letterSpacing: -0.5 },
  introText: { fontSize: 14, fontFamily: 'SpaceGrotesk', lineHeight: 20 },
  scrollContent: { paddingBottom: 96 },

  cardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  accountCard: {
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  decoCircle1: {
    position: 'absolute',
    right: -35,
    top: -35,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  decoCircle2: {
    position: 'absolute',
    right: 50,
    top: 15,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bankLogo: {
    width: 28,
    height: 28,
  },
  bankInitials: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'SpaceGrotesk',
  },
  headerText: { flex: 1 },
  bankTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk',
  },
  accountTypeBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  accountTypeBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'SpaceGrotesk',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk',
    letterSpacing: 2,
  },
  cardStyleNumber: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk',
    letterSpacing: 3,
    marginTop: 2,
  },
  tapToHide: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk',
    marginTop: 8,
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk',
  },
  // Empty handled by component
});

export default BankAccountsSection;
