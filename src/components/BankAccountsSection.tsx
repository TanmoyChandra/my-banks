import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Share, Image, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Text, Button, useTheme, IconButton } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { BankAccount } from '../types';
import { findBankByName } from '../constants/banks';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface BankAccountsSectionProps {
  accounts: BankAccount[];
}

const AccountItem: React.FC<{ account: BankAccount }> = ({ account }) => {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();
  const bank = findBankByName(account.bankName);
  const cardBg = theme.colors.surfaceVariant;
  const cardBorder = theme.colors.outlineVariant;
  const mainTextColor = theme.colors.onSurface;
  const subTextColor = theme.colors.onSurfaceVariant;

  const toggleExpand = () => {
    LayoutAnimation.configureNext({
      duration: 500,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'easeInEaseOut' },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    });
    setExpanded(!expanded);
  };

  const handleCopy = async (text: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
  };

  const handleShare = async () => {
    const message = `Bank Account Details\nBank: ${account.bankName}\nHolder: ${account.accountHolder}\nA/C: ${account.accountNumber}\nIFSC: ${account.ifsc}\nType: ${account.accountType}\nBranch: ${account.branchName}`;
    try {
      await Share.share({ message });
    } catch (error) {}
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <TouchableOpacity 
      activeOpacity={0.6} 
      onPress={() => handleCopy(value)}
      style={styles.infoRow}
    >
      <Text style={[styles.infoLabel, { color: subTextColor }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: mainTextColor }]}>{value || 'Not provided'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.cardWrapper}>
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={toggleExpand}
        style={[styles.accountCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
      >
        <View style={[styles.headerRow, { marginBottom: expanded ? 16 : 0 }]}>
          <View style={[styles.bankLogoBox, { backgroundColor: '#ffffff' }]}>
            {bank ? (
              <Image source={bank.symbol} style={styles.bankLogo} resizeMode="contain" />
            ) : (
              <Text style={styles.bankInitials}>
                {account.bankName.slice(0, 2).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.headerText}>
            <Text variant="titleMedium" numberOfLines={1} style={[styles.bankTitle, { color: mainTextColor }]}>
              {account.bankName}
            </Text>
            <Text style={[styles.accountTypeLabel, { color: subTextColor }]}>
              {expanded ? `${account.accountType} Account` : account.accountNumber.slice(-4).padStart(account.accountNumber.length, '*')}
            </Text>
          </View>
          {expanded && (
            <IconButton 
              icon="share-variant" 
              size={20} 
              iconColor={mainTextColor}
              onPress={handleShare}
              style={styles.headerShare}
            />
          )}
        </View>

        {expanded && (
          <View style={styles.expandedContent}>
            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]} />
            <InfoRow label="ACCOUNT HOLDER" value={account.accountHolder} />
            <InfoRow label="ACCOUNT NUMBER" value={account.accountNumber} />
            <InfoRow label="IFSC CODE" value={account.ifsc.toUpperCase()} />
            <InfoRow label="BRANCH" value={account.branchName} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const BankAccountsSection: React.FC<BankAccountsSectionProps> = ({ accounts }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.sectionIntro}>
        <Text style={[styles.introTitle, { color: theme.colors.onSurface }]}>Bank accounts</Text>
        <Text style={[styles.introText, { color: theme.dark ? '#a1a1aa' : '#52525b' }]}>Keep IFSC and account details easy to find while masking sensitive numbers.</Text>
      </View>

      {accounts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>Add new</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {accounts.map(acc => <AccountItem key={acc.id} account={acc} />)}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionIntro: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 },
  introTitle: { fontSize: 28, fontWeight: '900', fontFamily: 'PlusJakartaSans-ExtraBold', color: '#000000', marginTop: 0, letterSpacing: -0.5 },
  introText: { fontSize: 14, lineHeight: 24, fontFamily: 'PlusJakartaSans-Medium', color: '#52525b', marginTop: 8 },
  scrollContent: { paddingBottom: 96 },
  cardWrapper: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  accountCard: {
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankLogoBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE6F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bankLogo: {
    width: 34,
    height: 18,
  },
  bankInitials: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },
  headerText: {
    flex: 1,
  },
  bankTitle: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  accountTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginTop: 2,
  },
  headerShare: {
    margin: 0,
    marginRight: -8,
  },
  expandedContent: {
    marginTop: 0,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 14,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '900',
    opacity: 0.3,
  },
});

export default BankAccountsSection;
