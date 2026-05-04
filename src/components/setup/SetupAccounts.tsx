import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Appbar, 
  TextInput, 
  Button, 
  Text, 
  List, 
  IconButton, 
  useTheme,
  Surface,
  SegmentedButtons,
  Avatar
} from 'react-native-paper';
import { BankAccount } from '../../types';
import BankPicker from '../BankPicker';

interface SetupAccountsProps {
  accounts: BankAccount[];
  onAdd: (account: Omit<BankAccount, 'id'>) => void;
  onUpdate: (id: string, account: Omit<BankAccount, 'id'>) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const emptyForm = (): Omit<BankAccount, 'id'> => ({
  bankName: '',
  accountHolder: '',
  accountNumber: '',
  ifsc: '',
  accountType: 'Savings',
  branchName: '',
});

const SetupAccounts: React.FC<SetupAccountsProps> = ({ accounts, onAdd, onUpdate, onDelete, onBack }) => {
  const [form, setForm] = useState<Omit<BankAccount, 'id'>>(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [bankPickerVisible, setBankPickerVisible] = useState(false);
  const theme = useTheme();

  const handleSave = () => {
    if (!form.bankName.trim() || !form.accountHolder.trim() || !form.accountNumber.trim() || form.ifsc.length < 11) {
      Alert.alert('Validation Error', 'Please fill all required fields and ensure IFSC is 11 characters.');
      return;
    }
    if (editId) {
      onUpdate(editId, form);
    } else {
      onAdd(form);
    }
    handleCancel();
  };

  const handleEdit = (account: BankAccount) => {
    setForm({ ...account });
    setEditId(account.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setForm(emptyForm());
    setEditId(null);
    setShowForm(false);
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete Account', 'Are you sure you want to delete this account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(id) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction color="white" onPress={onBack} />
        <Appbar.Content title="Setup Accounts" titleStyle={{ color: 'white' }} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {showForm ? (
          <Surface style={styles.formCard} elevation={1}>
            <Text variant="titleMedium" style={styles.formTitle}>
              {editId ? 'Edit Account' : 'New Account'}
            </Text>

            <View style={styles.inputGroup}>
              <Text variant="labelSmall" style={styles.label}>ACCOUNT TYPE</Text>
              <SegmentedButtons
                value={form.accountType}
                onValueChange={v => setForm(p => ({ ...p, accountType: v as 'Savings' | 'Current' }))}
                buttons={[
                  { value: 'Savings', label: 'Savings' },
                  { value: 'Current', label: 'Current' },
                ]}
              />
            </View>

            <TextInput
              label="Bank Name *"
              value={form.bankName}
              mode="outlined"
              style={styles.input}
              right={<TextInput.Icon icon="chevron-down" onPress={() => setBankPickerVisible(true)} />}
              showSoftInputOnFocus={false}
              onFocus={() => setBankPickerVisible(true)}
            />

            <TextInput
              label="Account Holder Name *"
              value={form.accountHolder}
              onChangeText={v => setForm(p => ({ ...p, accountHolder: v }))}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Account Number *"
              value={form.accountNumber}
              onChangeText={v => setForm(p => ({ ...p, accountNumber: v.replace(/\D/g, '') }))}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
            />
            <TextInput
              label="IFSC Code *"
              value={form.ifsc}
              onChangeText={v => setForm(p => ({ ...p, ifsc: v.toUpperCase() }))}
              mode="outlined"
              style={styles.input}
              autoCapitalize="characters"
              maxLength={11}
            />
            <TextInput
              label="Branch Name"
              value={form.branchName}
              onChangeText={v => setForm(p => ({ ...p, branchName: v }))}
              mode="outlined"
              style={styles.input}
            />

            <View style={styles.buttonRow}>
              <Button mode="outlined" onPress={handleCancel} style={styles.flexBtn}>
                Cancel
              </Button>
              <Button mode="contained" onPress={handleSave} style={styles.flexBtn}>
                {editId ? 'Update' : 'Save'}
              </Button>
            </View>
          </Surface>
        ) : (
          <View>
            <Button 
              mode="contained" 
              icon="plus" 
              onPress={() => setShowForm(true)}
              style={styles.addBtn}
            >
              Add Bank Account
            </Button>

            {accounts.length === 0 ? (
              <View style={styles.empty}>
                <Avatar.Icon size={64} icon="bank" style={{ backgroundColor: theme.colors.surfaceVariant }} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.emptyText}>No accounts added yet.</Text>
              </View>
            ) : (
              accounts.map(account => (
                <Surface key={account.id} style={styles.listItem} elevation={1}>
                  <List.Item
                    title={account.bankName}
                    description={`${account.accountType} • ${account.accountNumber.slice(-4)}`}
                    left={props => <List.Icon {...props} icon="bank" />}
                    right={() => (
                      <View style={styles.itemActions}>
                        <IconButton icon="pencil" size={20} onPress={() => handleEdit(account)} />
                        <IconButton icon="delete" size={20} iconColor={theme.colors.error} onPress={() => confirmDelete(account.id)} />
                      </View>
                    )}
                  />
                </Surface>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <BankPicker 
        visible={bankPickerVisible} 
        onDismiss={() => setBankPickerVisible(false)} 
        onSelect={(name) => setForm(p => ({ ...p, bankName: name }))} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  formTitle: {
    marginBottom: 16,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 4,
    fontWeight: '700',
    color: '#6750A4',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  flexBtn: {
    flex: 1,
  },
  addBtn: {
    marginBottom: 20,
    paddingVertical: 4,
  },
  listItem: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  itemActions: {
    flexDirection: 'row',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 12,
    color: '#79747E',
  },
});

export default SetupAccounts;
