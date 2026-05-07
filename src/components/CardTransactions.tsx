import React, { useState, useMemo } from 'react';
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

// ─── Add Transaction Modal ─────────────────────────────────────
function AddTransactionModal({
  visible,
  cardId,
  onClose,
}: {
  visible: boolean;
  cardId: string;
  onClose: () => void;
}) {
  const theme = useTheme();
  const isDark = theme.dark;
  const addTransaction = useWalletStore((s) => s.addTransaction);

  const [txType, setTxType] = useState<'debit' | 'credit'>('debit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const bgColor = isDark ? '#18181b' : '#FFFFFF';
  const inputBg = isDark ? '#27272a' : '#F5F5F5';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subColor = isDark ? '#a1a1aa' : '#6B7280';
  const borderColor = isDark ? '#27272a' : '#E5E7EB';

  const handleAdd = () => {
    const val = parseFloat(amount.replace(/,/g, ''));
    if (!val || val <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please add a short description.');
      return;
    }
    addTransaction({
      cardId,
      type: txType,
      amount: val,
      description: description.trim(),
      date: new Date().toISOString(),
    });
    setAmount('');
    setDescription('');
    setTxType('debit');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalSheet, { backgroundColor: bgColor, borderColor }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: subColor }]} />

          <Text style={[styles.modalTitle, { color: textColor }]}>Add Transaction</Text>

          {/* Type toggle */}
          <View style={[styles.toggleRow, { backgroundColor: inputBg }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.toggleBtn, txType === 'debit' && styles.toggleActive]}
              onPress={() => setTxType('debit')}
            >
              <Text
                style={[
                  styles.toggleLabel,
                  { color: txType === 'debit' ? '#000000' : subColor },
                ]}
              >
                ↑ Spent / Owed
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.toggleBtn, txType === 'credit' && styles.toggleActiveGreen]}
              onPress={() => setTxType('credit')}
            >
              <Text
                style={[
                  styles.toggleLabel,
                  { color: txType === 'credit' ? '#000000' : subColor },
                ]}
              >
                ↓ Payment Made
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <Text style={[styles.fieldLabel, { color: subColor }]}>Amount (₹)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={subColor}
            keyboardType="decimal-pad"
            selectionColor="#AAEF00"
          />

          {/* Description */}
          <Text style={[styles.fieldLabel, { color: subColor }]}>Description</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Amazon purchase"
            placeholderTextColor={subColor}
            selectionColor="#AAEF00"
          />

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalCancelBtn, { borderColor }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={[styles.modalCancelLabel, { color: textColor }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalAddBtn, { backgroundColor: '#AAEF00' }]}
              onPress={handleAdd}
              activeOpacity={0.8}
            >
              <Text style={styles.modalAddLabel}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Transaction Row ───────────────────────────────────────────
function TransactionRow({
  tx,
  onDelete,
}: {
  tx: CardTransaction;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const isDark = theme.dark;
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subColor = isDark ? '#a1a1aa' : '#6B7280';
  const rowBg = isDark ? '#18181b' : '#F5F5F5';
  const isDebit = tx.type === 'debit';

  return (
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
        <Text style={[styles.txDesc, { color: textColor }]} numberOfLines={1}>
          {tx.description}
        </Text>
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
          {isDebit ? '+' : '-'}₹{fmt(tx.amount)}
        </Text>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.txDelete, { color: subColor }]}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────
export default function CardTransactions({ card, onBack }: CardTransactionsProps) {
  const theme = useTheme();
  const isDark = theme.dark;
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);

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
            <Text style={[styles.statValue, { color: '#AAEF00' }]}>
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
            <TransactionRow key={tx.id} tx={tx} onDelete={() => handleDelete(tx.id)} />
          ))
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        activeOpacity={0.85}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* ── Add Modal ── */}
      <AddTransactionModal
        visible={modalVisible}
        cardId={card.id}
        onClose={() => setModalVisible(false)}
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
  },
  txDate: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 2,
  },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  txDelete: { fontSize: 13, fontWeight: '700', paddingHorizontal: 4 },

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

  // FAB
  fab: {
    position: 'absolute',
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#AAEF00',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#AAEF00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  fabIcon: {
    fontSize: 30,
    fontWeight: '900',
    color: '#000000',
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
  toggleActive: { backgroundColor: '#EF4444' },
  toggleActiveGreen: { backgroundColor: '#AAEF00' },
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
