import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
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
  Dialog
} from 'react-native-paper';
import { CardEntry } from '../../types';
import BankPicker from '../BankPicker';
import ColorPicker from '../ColorPicker';
import { CARD_COLORS } from '../../constants/cardColors';

const FIRST_COLOR = CARD_COLORS[0].key;

const emptyForm = (): Omit<CardEntry, 'id'> => ({
  type: 'Debit',
  bankName: '',
  holderName: '',
  cardNumber: '',
  expiry: '',
  cvv: '',
  nickname: '',
  color: FIRST_COLOR,
});

function CardRow({ 
  card, 
  onEdit, 
  onDelete 
}: { 
  card: CardEntry; 
  onEdit: () => void; 
  onDelete: () => void; 
}) {
  const theme = useTheme();

  return (
    <Surface style={styles.listItem} elevation={1}>
      <List.Item
        title={card.bankName}
        titleStyle={{ fontWeight: '700' }}
        description={`${card.type} • ${card.cardNumber.slice(-4)}`}
        left={props => <List.Icon {...props} icon="credit-card" />}
        right={() => (
          <View style={styles.itemActions}>
            <IconButton icon="pencil-outline" size={20} iconColor={theme.colors.onSurfaceVariant} onPress={onEdit} />
            <IconButton icon="delete-outline" size={20} iconColor={theme.colors.error} onPress={onDelete} />
          </View>
        )}
        style={{ backgroundColor: theme.colors.surface }}
      />
    </Surface>
  );
}

const SetupCards: React.FC<SetupCardsProps> = ({ cards, onAdd, onUpdate, onDelete, onBack }) => {
  const [form, setForm] = useState<Omit<CardEntry, 'id'>>(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [bankPickerVisible, setBankPickerVisible] = useState(false);
  const theme = useTheme();
  
  const [dialogState, setDialogState] = useState<{ visible: boolean; title: string; message: string; onConfirm?: () => void }>({ visible: false, title: '', message: '' });

  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
    setDialogState({ visible: true, title, message, onConfirm });
  };

  const handleSave = () => {
    if (!form.bankName.trim() || !form.holderName.trim() || form.cardNumber.length < 12) {
      showAlert('Incomplete Info', 'Please provide valid bank name, card holder name, and card number.');
      return;
    }
    if (editId) {
      onUpdate(editId, form);
    } else {
      onAdd(form);
    }
    handleCancel();
  };

  const handleEdit = (card: CardEntry) => {
    setForm({ ...card });
    setEditId(card.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setForm(emptyForm());
    setEditId(null);
    setShowForm(false);
  };

  const formatCardDisplay = (num: string) => {
    const clean = num.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const handleCardNumberChange = (val: string) => {
    setForm(p => ({ ...p, cardNumber: formatCardDisplay(val) }));
  };

  const handleExpiryChange = (val: string) => {
    let clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) clean = clean.slice(0, 2) + '/' + clean.slice(2);
    setForm(p => ({ ...p, expiry: clean }));
  };

  const handleCvvChange = (val: string) => {
    setForm(p => ({ ...p, cvv: val.replace(/\D/g, '').slice(0, 4) }));
  };

  const confirmDelete = (id: string) => {
    showAlert('Delete Card', 'Are you sure you want to delete this card?', () => onDelete(id));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="Setup Debit/Credit Card" titleStyle={{ fontWeight: '900' }} />
        <Appbar.Action icon="close" onPress={onBack} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {showForm ? (
          <Surface style={styles.formCard} elevation={1}>
            <Text variant="titleMedium" style={styles.formTitle}>
              {editId ? 'Edit Card' : 'New Card'}
            </Text>

            <View style={styles.inputGroup}>
              <SegmentedButtons
                value={form.type}
                onValueChange={v => setForm(p => ({ ...p, type: v as 'Credit' | 'Debit' }))}
                buttons={[
                  { value: 'Debit', label: 'Debit' },
                  { value: 'Credit', label: 'Credit' },
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
              label="Card Holder Name *"
              value={form.holderName}
              onChangeText={v => setForm(p => ({ ...p, holderName: v }))}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Card Number *"
              value={form.cardNumber}
              onChangeText={handleCardNumberChange}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              maxLength={19}
            />
            
            <View style={styles.row}>
              <TextInput
                label="Expiry (MM/YY) *"
                value={form.expiry}
                onChangeText={handleExpiryChange}
                mode="outlined"
                style={[styles.input, { flex: 1 }]}
                keyboardType="numeric"
                maxLength={5}
              />
              <TextInput
                label="CVV"
                value={form.cvv}
                onChangeText={handleCvvChange}
                mode="outlined"
                style={[styles.input, { flex: 1, marginLeft: 12 }]}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <TextInput
              label="Nickname"
              value={form.nickname}
              onChangeText={v => setForm(p => ({ ...p, nickname: v }))}
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
              Add New Card
            </Button>

            {cards.length === 0 ? (
              <View style={styles.empty}>
                <Avatar.Icon size={64} icon="card-bulleted" style={{ backgroundColor: theme.colors.surfaceVariant }} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No cards added yet.</Text>
              </View>
            ) : (
              cards.map(card => (
                <CardRow
                  key={card.id}
                  card={card}
                  onEdit={() => handleEdit(card)}
                  onDelete={() => confirmDelete(card.id)}
                />
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

      <Portal>
        <Dialog visible={dialogState.visible} onDismiss={() => setDialogState(s => ({ ...s, visible: false }))}>
          <Dialog.Title>{dialogState.title}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{dialogState.message}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            {dialogState.onConfirm && (
              <Button onPress={() => setDialogState(s => ({ ...s, visible: false }))}>Cancel</Button>
            )}
            <Button 
              textColor={dialogState.onConfirm ? theme.colors.error : theme.colors.primary} 
              onPress={() => {
                if (dialogState.onConfirm) dialogState.onConfirm();
                setDialogState(s => ({ ...s, visible: false }));
              }}
            >
              {dialogState.onConfirm ? 'Delete' : 'OK'}
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
  row: {
    flexDirection: 'row',
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
  colorRow: {
    paddingVertical: 8,
    gap: 12,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
});

export default SetupCards;
