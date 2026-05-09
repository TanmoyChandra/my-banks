import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Share, Image, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Text, Button, useTheme, IconButton, List, Surface, Avatar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    <Surface elevation={1} style={{ borderRadius: 16, marginBottom: 16, marginHorizontal: 24, overflow: 'hidden' }}>
      <List.Accordion
        title={account.bankName}
        description={expanded ? `${account.accountType} Account` : account.accountNumber.slice(-4).padStart(account.accountNumber.length, '*')}
        expanded={expanded}
        onPress={() => setExpanded(!expanded)}
        left={props => bank ? (
          <Avatar.Image {...props} source={bank.symbol} size={40} style={[props.style, { backgroundColor: 'white' }]} />
        ) : (
          <Avatar.Text {...props} label={account.bankName.slice(0, 2).toUpperCase()} size={40} />
        )}
        style={{ backgroundColor: cardBg }}
        titleStyle={[styles.bankTitle, { color: mainTextColor }]}
        descriptionStyle={[styles.accountTypeLabel, { color: subTextColor }]}
      >
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, backgroundColor: cardBg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: -8, marginBottom: 8 }}>
            <IconButton icon="share-variant" size={20} iconColor={mainTextColor} onPress={handleShare} />
          </View>
          <InfoRow label="ACCOUNT HOLDER" value={account.accountHolder} />
          <InfoRow label="ACCOUNT NUMBER" value={account.accountNumber} />
          <InfoRow label="IFSC CODE" value={account.ifsc.toUpperCase()} />
          <InfoRow label="BRANCH" value={account.branchName} />
        </View>
      </List.Accordion>
    </Surface>
  );
};

const BankAccountsSection: React.FC<BankAccountsSectionProps> = ({ accounts }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.sectionIntro}>
        <Text style={[styles.introTitle, { color: theme.colors.onSurface }]}>Bank accounts</Text>
        <Text style={[styles.introText, { color: theme.dark ? '#a1a1aa' : '#52525b' }]}>Keep IFSC and account details easy to find while masking sensitive numbers.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {accounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Avatar.Icon size={64} icon="bank-outline" style={{ backgroundColor: theme.colors.surfaceVariant, marginBottom: 16 }} color={theme.colors.primary} />
            <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>No bank accounts</Text>
            <Text style={[styles.emptySubText, { color: theme.colors.onSurfaceVariant }]}>
              Add accounts from Settings to view them here
            </Text>
          </View>
        ) : (
          accounts.map(acc => <AccountItem key={acc.id} account={acc} />)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionIntro: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 },
  introTitle: { fontSize: 34, fontWeight: '900', fontFamily: 'PlusJakartaSans-ExtraBold', marginTop: 0, letterSpacing: -1 },
  introText: { fontSize: 15, fontFamily: 'PlusJakartaSans-Medium', marginTop: 4 },
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
  emptySubText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default BankAccountsSection;
