import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Clipboard, TouchableOpacity, LayoutAnimation, UIManager, Platform } from 'react-native';
import { Text, IconButton, Button, useTheme } from 'react-native-paper';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { BankAccount } from '../types';

interface BankAccountsSectionProps {
  accounts: BankAccount[];
  onSetup: () => void;
}

const AccountItem: React.FC<{ account: BankAccount }> = ({ account }) => {
  const [expanded, setExpanded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const theme = useTheme();

  const handleCopy = (text: string) => {
    Clipboard.setString(text);
  };

  const maskAccount = (num: string) => {
    if (num.length <= 4) return num;
    return '•'.repeat(num.length - 4) + num.slice(-4);
  };

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={[styles.accountCard, { backgroundColor: expanded ? (theme.dark ? '#18181b' : '#f4fbf0') : theme.colors.surface }]}>
      <TouchableOpacity activeOpacity={0.7} onPress={toggleExpand} style={styles.accountSummary}>
        <View style={styles.summaryLeft}>
          <Text style={[styles.bankName, { color: theme.colors.onSurface }]}>{account.bankName}</Text>
          <Text style={styles.holderName}>{account.accountHolder}</Text>
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.accountLabel}>Account</Text>
          <Text style={[styles.accountMasked, { color: theme.colors.onSurface }]}>{maskAccount(account.accountNumber)}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.accountDetails, { borderTopColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>IFSC</Text>
              <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>{account.ifsc.toUpperCase()}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Account</Text>
              <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>{account.accountNumber}</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            <Button mode="text" textColor={theme.colors.onSurface} onPress={() => handleCopy(account.ifsc)} compact style={styles.actionBtn}>Copy IFSC</Button>
            <Button mode="text" textColor={theme.colors.onSurface} onPress={() => handleCopy(account.accountNumber)} compact style={styles.actionBtn}>Copy Account</Button>
          </View>
        </View>
      )}
    </View>
  );
};

const BankAccountsSection: React.FC<BankAccountsSectionProps> = ({ accounts, onSetup }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.sectionIntro}>
        <View style={styles.introHeader}>
          <View style={styles.introIconBox}>
            <IconButton icon="bank" size={24} iconColor="#000000" />
          </View>
          <Button mode="contained" buttonColor={theme.dark ? '#FFFFFF' : '#000000'} textColor={theme.dark ? '#000000' : '#FFFFFF'} icon="plus" onPress={onSetup} style={styles.addButton} labelStyle={styles.addButtonLabel}>
            Add
          </Button>
        </View>
        <Text style={[styles.introTitle, { color: theme.colors.onSurface }]}>Bank accounts</Text>
        <Text style={[styles.introText, { color: theme.dark ? '#a1a1aa' : '#52525b' }]}>Keep IFSC and account details easy to find while masking sensitive numbers.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {accounts.length === 0 ? (
          <Text style={styles.emptyText}>No accounts found.</Text>
        ) : (
          accounts.map(acc => <AccountItem key={acc.id} account={acc} />)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionIntro: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 },
  introHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  introIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#BEF264', alignItems: 'center', justifyContent: 'center' },
  addButton: { borderRadius: 24 },
  addButtonLabel: { fontWeight: '900', fontSize: 14 },
  introTitle: { fontSize: 28, fontWeight: '900', color: '#09090b', marginTop: 20, letterSpacing: -0.5 },
  introText: { fontSize: 14, lineHeight: 24, color: '#52525b', marginTop: 8 },
  scrollContent: {
    paddingBottom: 96,
  },
  accountCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 32,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.07,
    shadowRadius: 34,
    elevation: 4,
  },
  accountSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLeft: {
    flex: 1,
    paddingRight: 16,
  },
  bankName: {
    fontSize: 18,
    fontWeight: '900',
  },
  holderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717a',
    marginTop: 4,
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  accountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717a',
  },
  accountMasked: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  accountDetails: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717a',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionBtn: {
    margin: 0,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#79747E',
  },
});

export default BankAccountsSection;
