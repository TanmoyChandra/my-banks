import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, IconButton, useTheme, TextInput as PaperInput, SegmentedButtons, Portal, Dialog, Button, Appbar, FAB, Avatar, List, Chip, Paragraph, Surface } from 'react-native-paper';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { DatePickerModal } from 'react-native-paper-dates';
import { CardEntry, CardTransaction } from '../types';
import { useWalletStore } from '../store/useWalletStore';

interface CardTransactionsProps {
  card: CardEntry;
  onBack: () => void;
}

const fmt = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Transaction Modal ─────────────────────────────────────
function TransactionModal({
  visible,
  cardId,
  initialData,
  onClose,
}: {
  visible: boolean;
  cardId: string;
  initialData?: CardTransaction | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const isDark = theme.dark;
  const addTransaction = useWalletStore((s) => s.addTransaction);
  const updateTransaction = useWalletStore((s) => s.updateTransaction);

  const [txType, setTxType] = useState<'debit' | 'credit'>('debit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [payee, setPayee] = useState('me');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      setTxType(initialData.type);
      setAmount(initialData.amount.toString());
      setDescription(initialData.description);
      setPayee(initialData.payee || 'me');
      setDate(new Date(initialData.date));
    } else if (visible && !initialData) {
      setTxType('debit');
      setAmount('');
      setDescription('');
      setPayee('me');
      setDate(new Date());
    }
  }, [visible, initialData]);

  const bgColor = theme.colors.elevation.level3;
  const inputBg = theme.colors.surfaceVariant;
  const textColor = theme.colors.onSurface;
  const subColor = theme.colors.onSurfaceVariant;
  const borderColor = theme.colors.outlineVariant;

  const [dialogState, setDialogState] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });

  const showAlert = (title: string, message: string) => {
    setDialogState({ visible: true, title, message });
  };

  const handleSave = () => {
    const val = parseFloat(amount.replace(/,/g, ''));
    if (!val || val <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }
    if (!description.trim()) {
      showAlert('Missing Description', 'Please add a short description.');
      return;
    }

    const txData = {
      cardId,
      type: txType,
      amount: val,
      description: description.trim(),
      date: date.toISOString(),
      payee: payee.trim() || 'me',
    };

    if (initialData) {
      updateTransaction(initialData.id, txData);
    } else {
      addTransaction(txData);
    }
    onClose();
  };

  const handleConfirmDate = (params: any) => {
    setShowPicker(false);
    if (params.date) setDate(params.date);
  };

  return (
    <>
      <Modal
        isVisible={visible}
        onBackdropPress={onClose}
        onSwipeComplete={onClose}
        swipeDirection={['down']}
        style={{ margin: 0, justifyContent: 'flex-end' }}
        
        avoidKeyboard={true}
        useNativeDriver={true}
        useNativeDriverForBackdrop={true}
        hideModalContentWhileAnimating={true}
      >
        <View style={[styles.modalSheet, { backgroundColor: bgColor, borderColor }]}>
          {/* Handle */}
              <View style={[styles.handle, { backgroundColor: subColor }]} />

              <Text style={[styles.modalTitle, { color: textColor }]}>
                {initialData ? 'Edit Transaction' : 'Add Transaction'}
              </Text>

              {/* Type toggle (Hide if Edit Mode) */}
              {!initialData && (
                <SegmentedButtons
                  value={txType}
                  onValueChange={(val) => setTxType(val as 'debit' | 'credit')}
                  buttons={[
                    { value: 'debit', label: '↑ Spent' },
                    { value: 'credit', label: '↓ Payment Made' },
                  ]}
                  style={{ marginBottom: 20 }}
                />
              )}

              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 400 }}
              >
                {/* Amount */}
                <PaperInput
                  mode="outlined"
                  label="Amount (₹)"
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  style={{ marginBottom: 16 }}
                />

                {/* Description */}
                <PaperInput
                  mode="outlined"
                  label="Description"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="e.g. Amazon purchase"
                  style={{ marginBottom: 16 }}
                />

                {/* Payee (Hide if Payment Made) */}
                {txType === 'debit' && (
                  <PaperInput
                    mode="outlined"
                    label="For whom (Payee)"
                    value={payee}
                    onChangeText={setPayee}
                    placeholder="e.g. me"
                    style={{ marginBottom: 16 }}
                  />
                )}

                {/* Date */}
                <TouchableOpacity activeOpacity={0.8} onPress={() => setShowPicker(true)}>
                  <View pointerEvents="none">
                    <PaperInput
                      mode="outlined"
                      label="Date"
                      value={formatDate(date.toISOString())}
                      style={{ marginBottom: 16 }}
                      right={<PaperInput.Icon icon="calendar" />}
                    />
                  </View>
                </TouchableOpacity>

                <DatePickerModal
                  locale="en"
                  mode="single"
                  visible={showPicker}
                  onDismiss={() => setShowPicker(false)}
                  date={date}
                  onConfirm={handleConfirmDate}
                  animationType="slide"
                  presentationStyle="formSheet"
                />
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { borderColor }]}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalCancelLabel, { color: textColor }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalAddBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={handleSave}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalAddLabel, { color: theme.colors.onPrimary }]}>{initialData ? 'Save' : 'Add'}</Text>
                </TouchableOpacity>
              </View>
        </View>
      </Modal>

      <Portal>
        <Dialog visible={dialogState.visible} onDismiss={() => setDialogState(p => ({ ...p, visible: false }))} style={{ backgroundColor: theme.colors.surface }}>
          <Dialog.Title style={{ color: theme.colors.onSurface }}>{dialogState.title}</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>{dialogState.message}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogState(p => ({ ...p, visible: false }))} textColor={theme.colors.primary}>
              OK
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

// ─── Transaction Row ───────────────────────────────────────────
function TransactionRow({
  tx,
  onEdit,
  onDelete,
  onToggleFlag,
}: {
  tx: CardTransaction;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFlag: () => void;
}) {
  const theme = useTheme();
  const swipeableRef = useRef<any>(null);

  const isDark = theme.dark;
  const textColor = isDark ? '#FFFFFF' : '#202020';
  const subColor = isDark ? '#A1A1A1' : '#7A7A7A';
  const isDebit = tx.type === 'debit';
  const amountColor = isDebit ? textColor : (isDark ? '#A1D99B' : '#4F7922');

  const iconName = isDebit ? 'arrow-top-right' : 'arrow-bottom-left';
  const iconColor = isDebit ? (isDark ? '#FF6B6B' : '#D32F2F') : (isDark ? '#A1D99B' : '#4F7922');
  const iconBg = isDebit ? (isDark ? '#3D1515' : '#FFEBEE') : (isDark ? '#1C3118' : '#E8F5E9');

  const handleEditTap = () => {
    swipeableRef.current?.close();
    onEdit();
  };

  const renderLeftActions = () => (
    <TouchableOpacity 
      style={{ width: 80, backgroundColor: isDark ? '#1C3118' : '#E8F5E9', justifyContent: 'center', alignItems: 'center' }}
      onPress={handleEditTap}
      activeOpacity={0.8}
    >
      <IconButton icon="pencil" iconColor={isDark ? '#A1D99B' : '#4F7922'} />
    </TouchableOpacity>
  );

  const renderRightActions = () => (
    <TouchableOpacity 
      style={{ width: 80, backgroundColor: theme.colors.errorContainer, justifyContent: 'center', alignItems: 'center' }}
      onPress={onDelete}
      activeOpacity={0.8}
    >
      <IconButton icon="delete" iconColor={theme.colors.onErrorContainer} />
    </TouchableOpacity>
  );

  const formattedTime = new Date(tx.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const displayAmount = isDebit ? `-₹${tx.amount.toFixed(2)}` : `+₹${tx.amount.toFixed(2)}`;

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      overshootLeft={false}
      overshootRight={false}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, backgroundColor: theme.colors.surface }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
          <IconButton icon={iconName} iconColor={iconColor} size={24} style={{ margin: 0 }} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: textColor, fontWeight: '700', fontSize: 16, fontFamily: 'SpaceGrotesk' }}>{tx.description}</Text>
          <Text style={{ color: subColor, fontSize: 13, fontFamily: 'SpaceGrotesk', marginTop: 2 }}>
            {tx.payee || 'General'} • {formattedTime}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
          <Text style={{ fontWeight: '700', fontSize: 16, color: amountColor, fontFamily: 'SpaceGrotesk' }}>
            {displayAmount}
          </Text>
          <IconButton 
            icon={tx.isFlagged ? "flag" : "flag-outline"} 
            iconColor={tx.isFlagged ? theme.colors.error : subColor} 
            size={18} 
            onPress={onToggleFlag}
            style={{ margin: 0, marginTop: 4, width: 24, height: 24 }} 
          />
        </View>
      </View>
    </Swipeable>
  );
}

// ─── Main Screen ───────────────────────────────────────────────
export default function CardTransactions({ card, onBack }: CardTransactionsProps) {
  const theme = useTheme();
  const isDark = theme.dark;
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTx, setEditingTx] = useState<CardTransaction | null>(null);

  const transactions = useWalletStore((s) => s.transactions);
  const deleteTransaction = useWalletStore((s) => s.deleteTransaction);
  const updateTransaction = useWalletStore((s) => s.updateTransaction);

  const cardTxs = useMemo(
    () => transactions.filter((t) => t.cardId === card.id),
    [transactions, card.id]
  );

  const totalDue = useMemo(() => {
    return cardTxs.reduce((sum, t) => {
      return t.type === 'debit' ? sum + t.amount : sum - t.amount;
    }, 0);
  }, [cardTxs]);

  const groupedTxs = useMemo(() => {
    const groups: { [key: string]: CardTransaction[] } = {};
    const sorted = [...cardTxs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    sorted.forEach(tx => {
      const d = new Date(tx.date);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      
      let key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
      if (d.toDateString() === today.toDateString()) {
        key = 'TODAY';
      } else if (d.toDateString() === yesterday.toDateString()) {
        key = 'YESTERDAY';
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    return groups;
  }, [cardTxs]);

  const bgColor = theme.colors.background;
  const textColor = isDark ? '#FFFFFF' : '#202020';
  const subColor = isDark ? '#A1A1A1' : '#7A7A7A';

  const cardLabel = card.nickname.trim() || (card.type === 'Credit' ? 'Credit Card' : 'Debit Card');

  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [unflagDialog, setUnflagDialog] = useState<CardTransaction | null>(null);

  const handleDelete = (id: string) => {
    setDeleteDialog(id);
  };

  const handleToggleFlag = (tx: CardTransaction) => {
    if (tx.isFlagged) {
      setUnflagDialog(tx);
    } else {
      updateTransaction(tx.id, { ...tx, isFlagged: true });
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: bgColor, paddingTop: 0 }]}>
      {/* ── Header ── */}
      <Appbar.Header style={{ backgroundColor: bgColor }}>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title={cardLabel} titleStyle={{ fontWeight: '700', fontFamily: 'SpaceGrotesk', textAlign: 'center' }} />
        <Appbar.Action icon="dots-vertical" onPress={() => {}} />
      </Appbar.Header>

      <Surface style={[styles.totalCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
        <Text style={[styles.totalLabel, { color: subColor }]}>Total due</Text>
        <Text style={[styles.totalAmount, { color: textColor, marginBottom: 8 }]}>
          ₹ {fmt(Math.abs(totalDue))}
        </Text>
        <View style={styles.statsRowNew}>
          <View>
            <Text style={[styles.statLabelNew, { color: subColor }]}>Spent amount</Text>
            <Text style={[styles.statValueNew, { color: textColor }]}>₹ {fmt(cardTxs.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0))}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.statLabelNew, { color: subColor }]}>Amount Kept</Text>
            <Text style={[styles.statValueNew, { color: theme.colors.primary }]}>₹ {fmt(cardTxs.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0))}</Text>
          </View>
        </View>
      </Surface>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >

        {Object.keys(groupedTxs).map(dateKey => (
          <View key={dateKey} style={styles.dateGroup}>
            <Text style={[styles.dateHeader, { color: subColor }]}>{dateKey}</Text>
            <Surface style={[styles.groupCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
              {groupedTxs[dateKey].map((tx, index) => (
                <View key={tx.id}>
                  {index > 0 && <View style={[styles.txDivider, { backgroundColor: theme.colors.surfaceVariant }]} />}
                  <TransactionRow 
                    tx={tx} 
                    onEdit={() => {
                      setEditingTx(tx);
                      setModalVisible(true);
                    }}
                    onDelete={() => handleDelete(tx.id)} 
                    onToggleFlag={() => handleToggleFlag(tx)}
                  />
                </View>
              ))}
            </Surface>
          </View>
        ))}

        {cardTxs.length === 0 && (
          <View style={styles.empty}>
            <Avatar.Icon size={64} icon="receipt" style={{ backgroundColor: theme.colors.surfaceVariant, marginBottom: 16 }} color={theme.colors.primary} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>No transactions yet</Text>
            <Text style={[styles.emptySubtitle, { color: subColor }]}>
              Tap the + button to add your first entry
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + 24, backgroundColor: theme.colors.primaryContainer }]}
        color={theme.colors.onPrimaryContainer}
        onPress={() => {
          setEditingTx(null);
          setModalVisible(true);
        }}
      />

      {/* ── Add/Edit Modal ── */}
      <TransactionModal
        visible={modalVisible}
        cardId={card.id}
        initialData={editingTx}
        onClose={() => {
          setModalVisible(false);
          setTimeout(() => setEditingTx(null), 300);
        }}
      />

      <Portal>
        <Dialog visible={!!deleteDialog} onDismiss={() => setDeleteDialog(null)}>
          <Dialog.Title>Delete Transaction</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">Remove this transaction?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialog(null)}>Cancel</Button>
            <Button 
              textColor={theme.colors.error} 
              onPress={() => {
                if (deleteDialog) deleteTransaction(deleteDialog);
                setDeleteDialog(null);
              }}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={!!unflagDialog} onDismiss={() => setUnflagDialog(null)} style={{ backgroundColor: theme.colors.surface }}>
          <Dialog.Title style={{ color: theme.colors.onSurface }}>Unflag Transaction</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Are you sure you want to unflag this transaction?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setUnflagDialog(null)}>Cancel</Button>
            <Button 
              textColor={theme.colors.error} 
              onPress={() => {
                if (unflagDialog) {
                  updateTransaction(unflagDialog.id, { ...unflagDialog, isFlagged: false });
                }
                setUnflagDialog(null);
              }}
            >
              Unflag
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  backArrow: { fontSize: 24, fontFamily: 'SpaceGrotesk' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'SpaceGrotesk',
  },
  headerSub: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk',
    marginTop: 2,
  },

  // New Styles
  totalCard: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 24,
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 40,
    fontWeight: '900',
    fontFamily: 'SpaceGrotesk',
    letterSpacing: -1,
  },
  statsRowNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statLabelNew: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk',
    marginBottom: 2,
  },
  statValueNew: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterPillText: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  filterPillIcon: {
    margin: 0,
    width: 20,
    height: 20,
    marginLeft: 4,
  },
  
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '800',
    marginLeft: 24,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  groupCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  txDivider: {
    height: 1,
    marginHorizontal: 16,
    opacity: 0.5,
  },

  listContent: { paddingBottom: 100 },

  // Empty
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'SpaceGrotesk',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk',
    textAlign: 'center',
  },

  fab: {
    position: 'absolute',
    right: 24,
  },
  fabIcon: {
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
    opacity: 0.3,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'SpaceGrotesk',
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  toggleActive: {},
  toggleActiveGreen: {},
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk',
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalCancelLabel: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk',
  },
  modalAddBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalAddLabel: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'SpaceGrotesk',
    color: '#000000',
  },
});
