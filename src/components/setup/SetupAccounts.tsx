import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
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
  Avatar,
  Portal,
  Dialog,
  Paragraph
} from 'react-native-paper';
import { BankAccount } from '../../types';
import BankPicker from '../BankPicker';
import ColorPicker from '../ColorPicker';
import { CARD_COLORS } from '../../constants/cardColors';

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
  color: CARD_COLORS[0].key,
});

// ─── Account Row Component ─────────────────────────────────────
function AccountRow({ 
  account, 
  onEdit, 
  onDelete 
}: { 
  account: BankAccount; 
  onEdit: () => void; 
  onDelete: () => void; 
}) {
  const theme = useTheme();
  const swipeableRef = useRef<Swipeable>(null);

  const handleEditTap = () => {
    swipeableRef.current?.close();
    onEdit();
  };

  const renderLeftActions = () => (
    <TouchableOpacity 
      style={{ width: 80, backgroundColor: theme.colors.secondaryContainer, justifyContent: 'center', alignItems: 'center', borderRadius: 16, marginBottom: 12, marginLeft: 4 }}
      onPress={handleEditTap}
      activeOpacity={0.8}
    >
      <IconButton icon="pencil" iconColor={theme.colors.onSecondaryContainer} />
    </TouchableOpacity>
  );

  const renderRightActions = () => (
    <TouchableOpacity 
      style={{ width: 80, backgroundColor: theme.colors.errorContainer, justifyContent: 'center', alignItems: 'center', borderRadius: 16, marginBottom: 12, marginRight: 4 }}
      onPress={() => {
        swipeableRef.current?.close();
        onDelete();
      }}
      activeOpacity={0.8}
    >
      <IconButton icon="delete" iconColor={theme.colors.onErrorContainer} />
    </TouchableOpacity>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      overshootLeft={false}
      overshootRight={false}
    >
      <Surface style={styles.listItem} elevation={1}>
        <List.Item
          title={account.bankName}
          titleStyle={{ fontWeight: '700' }}
          description={`${account.accountType} • ${account.accountNumber.slice(-4)}`}
          left={props => <List.Icon {...props} icon="bank" />}
          style={{ backgroundColor: theme.colors.surface }}
        />
      </Surface>
    </Swipeable>
  );
}

const SetupAccounts: React.FC<SetupAccountsProps> = ({ accounts, onAdd, onUpdate, onDelete, onBack }) => {
  const [form, setForm] = useState<Omit<BankAccount, 'id'>>(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [bankPickerVisible, setBankPickerVisible] = useState(false);
  const theme = useTheme();

  const [dialogState, setDialogState] = useState<{ visible: boolean; title: string; message: string; onConfirm?: () => void; isDestructive?: boolean }>({ visible: false, title: '', message: '' });

  const showAlert = (title: string, message: string, onConfirm?: () => void, isDestructive?: boolean) => {
    setDialogState({ visible: true, title, message, onConfirm, isDestructive });
  };

  const handleSave = () => {
    if (!form.bankName.trim() || !form.accountHolder.trim() || !form.accountNumber.trim() || form.ifsc.length < 11) {
      showAlert('Validation Error', 'Please fill all required fields and ensure IFSC is 11 characters.');
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
    showAlert('Delete Account', 'Are you sure you want to delete this account?', () => onDelete(id), true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="Setup Bank Account" titleStyle={{ fontWeight: '900' }} />
        <Appbar.Action icon="close" onPress={onBack} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {showForm ? (
          <Surface style={styles.formCard} elevation={1}>
            <Text variant="titleMedium" style={styles.formTitle}>
              {editId ? 'Edit Account' : 'New Account'}
            </Text>

            <View style={styles.inputGroup}>
              <Text variant="labelSmall" style={[styles.label, { color: theme.colors.primary }]}>ACCOUNT TYPE</Text>
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

            <ColorPicker
              selected={form.color}
              onSelect={key => setForm(p => ({ ...p, color: key }))}
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
                <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No accounts added yet.</Text>
              </View>
            ) : (
              accounts.map(account => (
                <AccountRow
                  key={account.id}
                  account={account}
                  onEdit={() => handleEdit(account)}
                  onDelete={() => confirmDelete(account.id)}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      <BankPicker 
        visible={bankPickerVisible} 
        onDismiss={() => setBankPickerVisible(false)} 
        onSelect={(bankName) => setForm(p => ({ ...p, bankName }))} 
      />

      <Portal>
        <Dialog visible={dialogState.visible} onDismiss={() => setDialogState(p => ({ ...p, visible: false }))} style={{ backgroundColor: theme.colors.surface }}>
          <Dialog.Title style={{ color: theme.colors.onSurface }}>{dialogState.title}</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>{dialogState.message}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            {dialogState.onConfirm && (
              <Button onPress={() => setDialogState(p => ({ ...p, visible: false }))} textColor={theme.colors.primary}>
                Cancel
              </Button>
            )}
            <Button 
              onPress={() => {
                setDialogState(p => ({ ...p, visible: false }));
                if (dialogState.onConfirm) dialogState.onConfirm();
              }} 
              textColor={dialogState.isDestructive ? theme.colors.error : theme.colors.primary}
            >
              {dialogState.onConfirm ? (dialogState.isDestructive ? 'Delete' : 'Confirm') : 'OK'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16 },
  sheetTitle: { fontSize: 24, fontWeight: '900' },
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
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { marginTop: 12 },
});

export default SetupAccounts;
