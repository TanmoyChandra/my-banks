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
import { CardEntry } from '../../types';
import BankPicker from '../BankPicker';

interface SetupCardsProps {
  cards: CardEntry[];
  onAdd: (card: Omit<CardEntry, 'id'>) => void;
  onUpdate: (id: string, card: Omit<CardEntry, 'id'>) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const emptyForm = (): Omit<CardEntry, 'id'> => ({
  type: 'Debit',
  bankName: '',
  holderName: '',
  cardNumber: '',
  expiry: '',
  nickname: '',
});

const SetupCards: React.FC<SetupCardsProps> = ({ cards, onAdd, onUpdate, onDelete, onBack }) => {
  const [form, setForm] = useState<Omit<CardEntry, 'id'>>(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [bankPickerVisible, setBankPickerVisible] = useState(false);
  const theme = useTheme();

  const handleSave = () => {
    if (!form.bankName.trim() || !form.holderName.trim() || form.cardNumber.length < 12) {
      Alert.alert('Incomplete Info', 'Please provide valid bank name, card holder name, and card number.');
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction color="white" onPress={onBack} />
        <Appbar.Content title="Setup Cards" titleStyle={{ color: 'white' }} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {showForm ? (
          <Surface style={styles.formCard} elevation={1}>
            <Text variant="titleMedium" style={styles.formTitle}>
              {editId ? 'Edit Card' : 'New Card'}
            </Text>

            <View style={styles.inputGroup}>
              <Text variant="labelSmall" style={styles.label}>CARD TYPE</Text>
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
                label="Nickname"
                value={form.nickname}
                onChangeText={v => setForm(p => ({ ...p, nickname: v }))}
                mode="outlined"
                style={[styles.input, { flex: 1, marginLeft: 12 }]}
              />
            </View>

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
                <Text variant="bodyMedium" style={styles.emptyText}>No cards added yet.</Text>
              </View>
            ) : (
              cards.map(card => (
                <Surface key={card.id} style={styles.listItem} elevation={1}>
                  <List.Item
                    title={card.bankName}
                    description={`${card.type} • ${card.cardNumber.slice(-4)}`}
                    left={props => <List.Icon {...props} icon="credit-card" />}
                    right={() => (
                      <View style={styles.itemActions}>
                        <IconButton icon="pencil" size={20} onPress={() => handleEdit(card)} />
                        <IconButton icon="delete" size={20} iconColor={theme.colors.error} onPress={() => confirmDelete(card.id)} />
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
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 12,
    color: '#79747E',
  },
});

export default SetupCards;
