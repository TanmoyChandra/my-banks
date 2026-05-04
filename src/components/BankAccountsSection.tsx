import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Clipboard } from 'react-native';
import { List, Text, IconButton, Button, Avatar, useTheme, Divider, SegmentedButtons } from 'react-native-paper';
import { BankAccount } from '../types';
import EmptyState from './EmptyState';

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

  return (
    <List.Accordion
      title={account.bankName}
      description={`${account.accountHolder} • ${revealed ? account.accountNumber : maskAccount(account.accountNumber)}`}
      left={props => (
        <Avatar.Text
          {...props}
          size={44}
          label={account.bankName.substring(0, 2).toUpperCase()}
          style={{ backgroundColor: theme.colors.primaryContainer }}
          color={theme.colors.primary}
        />
      )}
      expanded={expanded}
      onPress={() => setExpanded(!expanded)}
      style={styles.accordion}
    >
      <View style={styles.details}>
        <List.Item
          title="Account Number"
          description={revealed ? account.accountNumber : maskAccount(account.accountNumber)}
          right={() => (
            <View style={styles.itemActions}>
              <IconButton icon={revealed ? "eye-off" : "eye"} size={20} onPress={() => setRevealed(!revealed)} />
              <Button mode="text" onPress={() => handleCopy(account.accountNumber)} compact>Copy</Button>
            </View>
          )}
        />
        <Divider />
        <List.Item
          title="IFSC Code"
          description={account.ifsc.toUpperCase()}
          right={() => (
            <Button mode="text" onPress={() => handleCopy(account.ifsc)} compact>Copy</Button>
          )}
        />
        {account.branchName ? (
          <>
            <Divider />
            <List.Item title="Branch" description={account.branchName} />
          </>
        ) : null}
        
        <View style={styles.infoRow}>
          <View style={[styles.infoPill, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>TYPE</Text>
            <Text variant="bodyMedium">{account.accountType}</Text>
          </View>
          <View style={[styles.infoPill, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>HOLDER</Text>
            <Text variant="bodyMedium" numberOfLines={1}>{account.accountHolder}</Text>
          </View>
        </View>
      </View>
    </List.Accordion>
  );
};

const BankAccountsSection: React.FC<BankAccountsSectionProps> = ({ accounts, onSetup }) => {
  const [filter, setFilter] = useState('All');
  const theme = useTheme();

  const filtered = filter === 'All' ? accounts : accounts.filter(a => a.accountType === filter);

  if (accounts.length === 0) {
    return (
      <EmptyState
        icon={<IconButton icon="bank" size={48} iconColor={theme.colors.primary} />}
        title="No Bank Accounts"
        description="Save your bank account details including account number and IFSC for quick reference and copying."
        actionLabel="Add Bank Account"
        onAction={onSetup}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <SegmentedButtons
          value={filter}
          onValueChange={setFilter}
          buttons={[
            { value: 'All', label: 'All' },
            { value: 'Savings', label: 'Savings' },
            { value: 'Current', label: 'Current' },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>No {filter.toLowerCase()} accounts found.</Text>
        ) : (
          filtered.map(acc => <AccountItem key={acc.id} account={acc} />)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBar: {
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  accordion: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 1,
  },
  details: {
    backgroundColor: '#FAF9FB',
    marginHorizontal: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingBottom: 12,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  infoPill: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#79747E',
  },
});

export default BankAccountsSection;
