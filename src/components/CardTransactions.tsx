import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import DateTimePicker from '@react-native-community/datetimepicker';
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

  const handleSave = () => {
    const val = parseFloat(amount.replace(/,/g, ''));
    if (!val || val <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please add a short description.');
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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[styles.modalSheet, { backgroundColor: bgColor, borderColor }]}>
              {/* Handle */}
              <View style={[styles.handle, { backgroundColor: subColor }]} />

              <Text style={[styles.modalTitle, { color: textColor }]}>
                {initialData ? 'Edit Transaction' : 'Add Transaction'}
              </Text>

              {/* Type toggle (Hide if Edit Mode) */}
              {!initialData && (
                <View style={[styles.toggleRow, { backgroundColor: inputBg }]}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.toggleBtn, txType === 'debit' && { backgroundColor: theme.colors.errorContainer }]}
                    onPress={() => setTxType('debit')}
                  >
                    <Text
                      style={[
                        styles.toggleLabel,
                        { color: txType === 'debit' ? theme.colors.onErrorContainer : subColor },
                      ]}
                    >
                      ↑ Spent
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.toggleBtn, txType === 'credit' && { backgroundColor: theme.colors.primaryContainer }]}
                    onPress={() => setTxType('credit')}
                  >
                    <Text
                      style={[
                        styles.toggleLabel,
                        { color: txType === 'credit' ? theme.colors.onPrimaryContainer : subColor },
                      ]}
                    >
                      ↓ Payment Made
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 400 }}
              >
                {/* Amount */}
                <Text style={[styles.fieldLabel, { color: subColor }]}>Amount (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={subColor}
                  keyboardType="decimal-pad"
                  selectionColor={theme.colors.primary}
                />

                {/* Description */}
                <Text style={[styles.fieldLabel, { color: subColor }]}>Description</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="e.g. Amazon purchase"
                  placeholderTextColor={subColor}
                  selectionColor={theme.colors.primary}
                />

                {/* Payee (Hide if Payment Made) */}
                {txType === 'debit' && (
                  <>
                    <Text style={[styles.fieldLabel, { color: subColor }]}>For whom (Payee)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                      value={payee}
                      onChangeText={setPayee}
                      placeholder="e.g. me"
                      placeholderTextColor={subColor}
                      selectionColor={theme.colors.primary}
                    />
                  </>
                )}

                {/* Date */}
                <Text style={[styles.fieldLabel, { color: subColor }]}>Date</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.input, { backgroundColor: inputBg, justifyContent: 'center' }]}
                  onPress={() => setShowPicker(true)}
                >
                  <Text style={{ color: textColor, fontSize: 16, fontFamily: 'PlusJakartaSans-SemiBold' }}>
                    {formatDate(date.toISOString())}
                  </Text>
                </TouchableOpacity>

                {showPicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}
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
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Transaction Row ───────────────────────────────────────────
function TransactionRow({
  tx,
  onEdit,
  onDelete,
}: {
  tx: CardTransaction;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const swipeableRef = useRef<Swipeable>(null);

  const isDark = theme.dark;
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subColor = isDark ? '#a1a1aa' : '#6B7280';
  const rowBg = isDark ? '#18181b' : '#F5F5F5';
  const chipBg = isDark ? '#27272a' : '#E5E7EB';
  const isDebit = tx.type === 'debit';

  const handleEditTap = () => {
    swipeableRef.current?.close();
    onEdit();
  };

  const renderLeftActions = () => (
    <TouchableOpacity 
      style={{ width: 80, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', borderRadius: 16, marginBottom: 10 }}
      onPress={handleEditTap}
      activeOpacity={0.8}
    >
      <Text style={{ color: '#FFF', fontWeight: 'bold', fontFamily: 'PlusJakartaSans-Bold' }}>Edit</Text>
    </TouchableOpacity>
  );

  const renderRightActions = () => (
    <TouchableOpacity 
      style={{ width: 80, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', borderRadius: 16, marginBottom: 10 }}
      onPress={onDelete}
      activeOpacity={0.8}
    >
      <Text style={{ color: '#FFF', fontWeight: 'bold', fontFamily: 'PlusJakartaSans-Bold' }}>Delete</Text>
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
      <View style={[styles.txRow, { backgroundColor: rowBg }]}>
        {/* Icon */}
        <View
          style={[
            styles.txIcon,
            { backgroundColor: isDebit ? '#FEE2E2' : '#DCFCE7' },
          ]}
        >
          <Text style={[styles.txIconText, { color: isDebit ? '#EF4444' : '#22C55E' }]}>
            {isDebit ? '↑' : '↓'}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.txInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.txDesc, { color: textColor, flexShrink: 1 }]} numberOfLines={1}>
              {tx.description}
            </Text>
            {isDebit && tx.payee ? (
              <View style={[styles.payeeChip, { backgroundColor: chipBg }]}>
                <Text style={[styles.payeeText, { color: textColor }]}>{tx.payee}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.txDate, { color: subColor }]}>{formatDate(tx.date)}</Text>
        </View>

        {/* Amount */}
        <View style={styles.txRight}>
          <Text
            style={[
              styles.txAmount,
              { color: isDebit ? '#EF4444' : '#22C55E' },
            ]}
          >
            ₹{fmt(tx.amount)}
          </Text>
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

  const cardTxs = useMemo(
    () => transactions.filter((t) => t.cardId === card.id),
    [transactions, card.id]
  );

  const totalDue = useMemo(() => {
    return cardTxs.reduce((sum, t) => {
      return t.type === 'debit' ? sum + t.amount : sum - t.amount;
    }, 0);
  }, [cardTxs]);

  const bgColor = isDark ? '#09090b' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subColor = isDark ? '#a1a1aa' : '#6B7280';
  const headerBg = isDark ? '#18181b' : '#F5F5F5';
  const cardBg = card.color || '#040404';

  const cardLabel = card.nickname.trim() || (card.type === 'Credit' ? 'Credit Card' : 'Debit Card');
  const maskedNum = card.cardNumber
    ? `••••  ${card.cardNumber.replace(/\D/g, '').slice(-4)}`
    : '••••';

  const handleDelete = (id: string) => {
    Alert.alert('Delete Transaction', 'Remove this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(id) },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: bgColor, paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: bgColor }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backArrow, { color: textColor }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: textColor }]}>{cardLabel}</Text>
          <Text style={[styles.headerSub, { color: subColor }]}>{maskedNum} · {card.type}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* ── Mini card strip ── */}
      <View style={[styles.miniCardStrip, { backgroundColor: cardBg }]}>
        {/* Due amount */}
        <View style={styles.dueSection}>
          <Text style={styles.dueLabel}>Total Due</Text>
          <Text style={styles.dueAmount}>
            {totalDue < 0 ? '-' : ''}₹{fmt(Math.abs(totalDue))}
          </Text>
          <Text style={styles.dueSubLabel}>
            {totalDue < 0 ? 'You have credit balance' : totalDue === 0 ? 'All settled ✓' : 'Outstanding balance'}
          </Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              ₹{fmt(cardTxs.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0))}
            </Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={[styles.statDivider]} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              ₹{fmt(cardTxs.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0))}
            </Text>
            <Text style={styles.statLabel}>Total Paid</Text>
          </View>
        </View>
      </View>

      {/* ── Transaction List ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: textColor }]}>Transactions</Text>
          <Text style={[styles.listCount, { color: subColor }]}>{cardTxs.length} entries</Text>
        </View>

        {cardTxs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={[styles.emptyTitle, { color: textColor }]}>No transactions yet</Text>
            <Text style={[styles.emptySubtitle, { color: subColor }]}>
              Tap the + button to add your first entry
            </Text>
          </View>
        ) : (
          cardTxs.map((tx) => (
            <TransactionRow 
              key={tx.id} 
              tx={tx} 
              onEdit={() => {
                setEditingTx(tx);
                setModalVisible(true);
              }}
              onDelete={() => handleDelete(tx.id)} 
            />
          ))
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24, backgroundColor: theme.colors.primaryContainer, shadowColor: theme.colors.primaryContainer }]}
        activeOpacity={0.85}
        onPress={() => {
          setEditingTx(null);
          setModalVisible(true);
        }}
      >
        <Text style={[styles.fabIcon, { color: theme.colors.onPrimaryContainer }]}>+</Text>
      </TouchableOpacity>

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
  backArrow: { fontSize: 24, fontFamily: 'PlusJakartaSans-Bold' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  headerSub: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 2,
  },

  // Mini card strip (due section)
  miniCardStrip: {
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 24,
    marginBottom: 8,
    // 3D shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 14,
  },
  dueSection: { alignItems: 'center', marginBottom: 20 },
  dueLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dueAmount: {
    color: '#FFFFFF',
    fontSize: 52,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontWeight: '900',
    letterSpacing: -2,
    marginTop: 6,
    lineHeight: 60,
  },
  dueSubLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    paddingTop: 16,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.15)' },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontWeight: '900',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 4,
  },

  // Transaction list
  listContent: { paddingHorizontal: 16, paddingTop: 16 },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  listCount: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
  },

  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIconText: { fontSize: 18, fontWeight: '900' },
  txInfo: { flex: 1 },
  txDesc: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 4,
  },
  txDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  payeeChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  payeeText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  txDate: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  txRight: { alignItems: 'flex-end', justifyContent: 'center' },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  txActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  txEdit: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#3b82f6',
  },
  txDelete: { 
    fontSize: 12, 
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold', 
    color: '#EF4444', 
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'PlusJakartaSans-ExtraBold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    textAlign: 'center',
  },

  fab: {
    position: 'absolute',
    right: 24,
    width: 64, // M3 FAB size
    height: 64,
    borderRadius: 16, // M3 squircle FAB
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
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
    fontFamily: 'PlusJakartaSans-ExtraBold',
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
    fontFamily: 'PlusJakartaSans-Bold',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-SemiBold',
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
    fontFamily: 'PlusJakartaSans-Bold',
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
    fontFamily: 'PlusJakartaSans-ExtraBold',
    color: '#000000',
  },
});
