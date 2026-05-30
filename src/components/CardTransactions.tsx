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
  Dimensions,
  FlatList,
  InteractionManager,
  ActivityIndicator,
} from 'react-native';
import { Text, IconButton, useTheme, TextInput as PaperInput, SegmentedButtons, Portal, Dialog, Button, Appbar, FAB, Avatar, List, Chip, Paragraph, Surface, Menu } from 'react-native-paper';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable, FlingGestureHandler, Directions, State } from 'react-native-gesture-handler';
import { DatePickerModal } from 'react-native-paper-dates';
import { LinearGradient } from 'expo-linear-gradient';
import { CardEntry, CardTransaction } from '../types';
import { useWalletStore } from '../store/useWalletStore';
import { getCardColors } from '../constants/cardColors';

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
  billingCycleId: string | null;
  initialData?: CardTransaction | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const isDark = theme.dark;
  const addTransaction = useWalletStore((s) => s.addTransaction);
  const updateTransaction = useWalletStore((s) => s.updateTransaction);
  const payees = useWalletStore((s) => s.payees);

  const [txType, setTxType] = useState<'debit' | 'credit'>('debit');
  const [amount, setAmount] = useState('');
  const amountInputRef = useRef<any>(null);
  const [description, setDescription] = useState('');
  const [payee, setPayee] = useState('Me');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [payeeMenuVisible, setPayeeMenuVisible] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      setTxType(initialData.type);
      setAmount(initialData.amount.toString());
      setDescription(initialData.description);
      setPayee(initialData.payee || 'Me');
      setDate(new Date(initialData.date));
    } else if (visible && !initialData) {
      setTxType('debit');
      setAmount('');
      setDescription('');
      setPayee('Me');
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
      billingCycleId: billingCycleId || undefined,
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
        propagateSwipe
        useNativeDriver={true}
        useNativeDriverForBackdrop={true}
        hideModalContentWhileAnimating={true}
        avoidKeyboard={true}
        onModalShow={() => amountInputRef.current?.focus()}
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
                  onValueChange={(val) => {
                    const newType = val as 'debit' | 'credit';
                    setTxType(newType);
                    if (newType === 'credit' && !description.trim()) {
                      setDescription('to Bank');
                    } else if (newType === 'debit' && description.trim() === 'to Bank') {
                      setDescription('');
                    }
                  }}
                  buttons={[
                    { value: 'debit', label: '↑ Spent' },
                    { value: 'credit', label: '↓ Payment Made' },
                  ]}
                  style={{ marginBottom: 20 }}
                  theme={{
                    colors: {
                      secondaryContainer: txType === 'debit'
                        ? (isDark ? '#3D1515' : '#FFEBEE')
                        : (isDark ? '#1C3118' : '#E8F5E9'),
                      onSecondaryContainer: txType === 'debit'
                        ? (isDark ? '#FF6B6B' : '#D32F2F')
                        : (isDark ? '#A1D99B' : '#4F7922'),
                    }
                  }}
                />
              )}

              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 400 }}
              >
                {/* Amount */}
                <PaperInput
                  ref={amountInputRef}
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

                {/* Payee */}
                <TouchableOpacity activeOpacity={0.8} onPress={() => setPayeeMenuVisible(!payeeMenuVisible)}>
                  <View pointerEvents="none">
                    <PaperInput
                      mode="outlined"
                      label="For whom (Payee)"
                      value={payee}
                      style={{ marginBottom: payeeMenuVisible ? 0 : 16 }}
                      right={<PaperInput.Icon icon={payeeMenuVisible ? "menu-up" : "menu-down"} />}
                    />
                  </View>
                </TouchableOpacity>
                {payeeMenuVisible && (
                  <View style={{ backgroundColor: theme.colors.surfaceVariant, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, marginBottom: 16, marginTop: -4, padding: 8, elevation: 4 }}>
                    {payees.map((p, i) => (
                      <TouchableOpacity 
                        key={p} 
                        onPress={() => { setPayee(p); setPayeeMenuVisible(false); }} 
                        style={{ 
                          paddingVertical: 12, 
                          paddingHorizontal: 8, 
                          borderBottomWidth: i === payees.length - 1 ? 0 : 1, 
                          borderBottomColor: theme.colors.outlineVariant, 
                          flexDirection: 'row', 
                          alignItems: 'center' 
                        }}
                      >
                        <Text style={{ color: textColor, fontWeight: payee === p ? '800' : '400', fontFamily: 'SpaceGrotesk', fontSize: 16 }}>{p}</Text>
                        {payee === p && <IconButton icon="check" size={18} iconColor={theme.colors.primary} style={{ margin: 0, marginLeft: 'auto' }} />}
                      </TouchableOpacity>
                    ))}
                  </View>
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
  const amountColor = isDebit ? (isDark ? '#FF6B6B' : '#D32F2F') : (isDark ? '#A1D99B' : '#4F7922');

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
  const displayAmount = isDebit ? `-₹${fmt(tx.amount)}` : `+₹${fmt(tx.amount)}`;

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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
            {(!tx.payee || tx.payee.toLowerCase() === 'me' || tx.payee.toLowerCase() === 'general') ? (
              <Text style={{ color: subColor, fontSize: 13, fontFamily: 'SpaceGrotesk' }}>
                {tx.payee || 'General'} • {formattedTime}
              </Text>
            ) : (
              <>
                <View style={{ backgroundColor: isDebit ? (isDark ? '#3D1515' : '#FFEBEE') : (isDark ? '#1C3118' : '#E8F5E9'), paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginRight: 6 }}>
                  <Text style={{ color: isDebit ? (isDark ? '#FF6B6B' : '#D32F2F') : (isDark ? '#A1D99B' : '#4F7922'), fontSize: 11, fontWeight: '800', fontFamily: 'SpaceGrotesk', letterSpacing: 0.5 }}>
                    {tx.payee}
                  </Text>
                </View>
                <Text style={{ color: subColor, fontSize: 13, fontFamily: 'SpaceGrotesk' }}>
                  • {formattedTime}
                </Text>
              </>
            )}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
          <Text style={{ fontWeight: '700', fontSize: 16, color: amountColor, fontFamily: 'SpaceGrotesk' }}>
            {displayAmount}
          </Text>
          <TouchableOpacity
            onPress={onToggleFlag}
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}
            activeOpacity={0.7}
          >
            <IconButton 
              icon={tx.isFlagged ? "flag" : "flag-outline"} 
              iconColor={tx.isFlagged ? theme.colors.error : subColor} 
              size={18} 
              style={{ margin: 0, width: 20, height: 20 }} 
            />
            {tx.isFlagged && (
              <Text style={{ fontSize: 11, fontWeight: '700', fontFamily: 'SpaceGrotesk', color: theme.colors.error, marginLeft: 2 }}>
                Due
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Swipeable>
  );
}

const { width: SCREEN_W } = Dimensions.get('window');

function CycleCard({ cycle, transactions, card, daysUntilBilling, palette, fmt, theme }: any) {
  const payees = useWalletStore(s => s.payees);

  const cycleTxs = useMemo(
    () => transactions.filter((t: any) => t.cardId === card.id && t.billingCycleId === cycle.id),
    [transactions, card.id, cycle.id]
  );

  const totalDue = useMemo(() => {
    return cycleTxs.reduce((sum: number, t: any) => {
      return t.type === 'debit' ? sum + t.amount : sum - t.amount;
    }, 0);
  }, [cycleTxs]);

  const duesByPayee = useMemo(() => {
    const dues: Record<string, number> = {};
    payees.forEach((p: string) => dues[p] = 0);
    cycleTxs.forEach((tx: any) => {
      let p = tx.payee || 'Me';
      if (p.toLowerCase() === 'me' || p.toLowerCase() === 'general') p = 'Me';
      if (dues[p] === undefined) dues[p] = 0;
      dues[p] += tx.type === 'debit' ? tx.amount : -tx.amount;
    });
    return dues;
  }, [cycleTxs, payees]);

  const spent = useMemo(() => cycleTxs.filter((t: any) => t.type === 'debit').reduce((s: number, t: any) => s + t.amount, 0), [cycleTxs]);
  const kept = useMemo(() => cycleTxs.filter((t: any) => t.type === 'credit').reduce((s: number, t: any) => s + t.amount, 0), [cycleTxs]);

  return (
    <View style={{ width: SCREEN_W, paddingHorizontal: 16 }}>
      <View style={[styles.totalCard, { overflow: 'hidden', marginHorizontal: 0 }]}>
        <LinearGradient
          colors={[palette.from, palette.via, palette.to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.07)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.07)', 'transparent']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.glow1, { backgroundColor: palette.glow1 }]} pointerEvents="none" />
        <View style={[styles.glow2, { backgroundColor: palette.glow2 }]} pointerEvents="none" />

        <View style={{ position: 'absolute', top: 18, right: -38, width: 130, backgroundColor: theme.colors.primary, transform: [{ rotate: '45deg' }], zIndex: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5 }}>
          <Text style={{ color: theme.colors.onPrimary, fontSize: 9, fontWeight: '800', fontFamily: 'SpaceGrotesk', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {cycle.name}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.totalLabel, { color: 'rgba(255,255,255,0.7)', marginBottom: 0 }]}>Total due</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 4 }}>
          <Text style={[styles.totalAmount, { color: '#FFFFFF' }]}>
            ₹ {fmt(Math.abs(totalDue))}
          </Text>
          {daysUntilBilling !== null && (
            <View style={{
              backgroundColor: daysUntilBilling <= 3 ? 'rgba(255,107,107,0.2)' : 'rgba(161,217,155,0.2)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              marginLeft: 12,
            }}>
              <IconButton
                icon="calendar-clock"
                size={14}
                iconColor={daysUntilBilling <= 3 ? '#FF8F8F' : '#A1D99B'}
                style={{ margin: 0, width: 16, height: 16 }}
              />
              <Text style={{
                fontSize: 11,
                fontWeight: '800',
                fontFamily: 'SpaceGrotesk',
                color: daysUntilBilling <= 3 ? '#FF8F8F' : '#A1D99B',
              }}>
                {daysUntilBilling === 0 ? 'Bill today!' : `${daysUntilBilling}d to bill`}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          {Object.entries(duesByPayee).filter(([_, amt]) => amt !== 0).map(([p, amt]) => (
            <View key={p} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: p === 'Me' ? '#FFFFFF' : 'rgba(255,255,255,0.5)' }} />
              <Text style={{ fontSize: 11, fontFamily: 'SpaceGrotesk', color: 'rgba(255,255,255,0.7)' }}>{p}: <Text style={{ fontWeight: '700', color: '#FFFFFF' }}>₹ {fmt(Math.abs(amt))}</Text></Text>
            </View>
          ))}
        </View>
        <View style={styles.statsRowNew}>
          <View>
            <Text style={[styles.statLabelNew, { color: 'rgba(255,255,255,0.7)' }]}>Spent amount</Text>
            <Text style={[styles.statValueNew, { color: '#FFFFFF' }]}>₹ {fmt(spent)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.statLabelNew, { color: 'rgba(255,255,255,0.7)' }]}>Amount Kept</Text>
            <Text style={[styles.statValueNew, { color: '#FFFFFF' }]}>₹ {fmt(kept)}</Text>
          </View>
        </View>
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
  const [editingTx, setEditingTx] = useState<CardTransaction | null>(null);

  const transactions = useWalletStore((s) => s.transactions);
  const deleteTransaction = useWalletStore((s) => s.deleteTransaction);
  const updateTransaction = useWalletStore((s) => s.updateTransaction);

  const billingCycles = useWalletStore((s) => s.billingCycles);
  const addBillingCycle = useWalletStore((s) => s.addBillingCycle);
  const deleteBillingCycle = useWalletStore((s) => s.deleteBillingCycle);
  const migrateLegacyTransactionsForCard = useWalletStore((s) => s.migrateLegacyTransactionsForCard);

  const cardCycles = useMemo(() => 
    billingCycles.filter(c => c.cardId === card.id).sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [billingCycles, card.id]
  );

  useEffect(() => {
    migrateLegacyTransactionsForCard(card.id);
  }, [card.id, migrateLegacyTransactionsForCard]);

  const [activeCycleId, setActiveCycleId] = useState<string | null>(null);
  const newlyCreatedRef = useRef(false);

  useEffect(() => {
    if (cardCycles.length > 0) {
      if (newlyCreatedRef.current) {
        setActiveCycleId(cardCycles[cardCycles.length - 1].id);
        newlyCreatedRef.current = false;
      } else if (!activeCycleId) {
        setActiveCycleId(cardCycles[0].id);
      }
    }
  }, [cardCycles, activeCycleId]);

  const [newCycleDialog, setNewCycleDialog] = useState(false);
  const [newCycleName, setNewCycleName] = useState('');
  const [cycleMenuVisible, setCycleMenuVisible] = useState(false);
  const [deleteCycleDialogMode, setDeleteCycleDialogMode] = useState(false);
  const [deleteCycleNameInput, setDeleteCycleNameInput] = useState('');

  const cardTxs = useMemo(
    () => transactions.filter((t) => t.cardId === card.id && (!activeCycleId || t.billingCycleId === activeCycleId)),
    [transactions, card.id, activeCycleId]
  );

  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (activeCycleId && cardCycles.length > 0 && listRef.current) {
      const index = cardCycles.findIndex(c => c.id === activeCycleId);
      if (index !== -1) {
        listRef.current.scrollToIndex({ index, animated: true });
      }
    }
  }, [activeCycleId, cardCycles]);

  const handleFlingLeft = () => {
    if (activeCycleId && cardCycles.length > 0) {
      const idx = cardCycles.findIndex(c => c.id === activeCycleId);
      if (idx !== -1 && idx < cardCycles.length - 1) {
        setActiveCycleId(cardCycles[idx + 1].id);
      }
    }
  };

  const handleFlingRight = () => {
    if (activeCycleId && cardCycles.length > 0) {
      const idx = cardCycles.findIndex(c => c.id === activeCycleId);
      if (idx > 0) {
        setActiveCycleId(cardCycles[idx - 1].id);
      }
    }
  };

  const [activeTab, setActiveTab] = useState<string>('All');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevCycleId = useRef(activeCycleId);

  useEffect(() => {
    if (activeCycleId !== prevCycleId.current) {
      setIsTransitioning(true);
      prevCycleId.current = activeCycleId;
      const handle = InteractionManager.runAfterInteractions(() => {
        setTimeout(() => setIsTransitioning(false), 10);
      });
      return () => handle.cancel();
    }
  }, [activeCycleId]);

  const otherPayees = useMemo(() => {
    const payeesSet = new Set<string>();
    cardTxs.forEach((tx) => {
      if (tx.type === 'debit' && tx.payee) {
        const name = tx.payee.trim();
        const lowerName = name.toLowerCase();
        if (lowerName !== 'me' && lowerName !== 'general') {
          payeesSet.add(name);
        }
      }
    });
    return Array.from(payeesSet).sort();
  }, [cardTxs]);

  const tabs = useMemo(() => ['All', 'Me', ...otherPayees, 'Payment Made'], [otherPayees]);

  useEffect(() => {
    if (!tabs.includes(activeTab)) {
      setActiveTab('All');
    }
  }, [tabs, activeTab]);

  const filteredTxs = useMemo(() => {
    if (activeTab === 'All') {
      return cardTxs;
    } else if (activeTab === 'Payment Made') {
      return cardTxs.filter((tx) => tx.type === 'credit');
    } else if (activeTab === 'Me') {
      return cardTxs.filter((tx) => {
        if (tx.type !== 'debit') return false;
        if (!tx.payee) return true;
        const lowerPayee = tx.payee.trim().toLowerCase();
        return lowerPayee === 'me' || lowerPayee === 'general';
      });
    } else {
      return cardTxs.filter((tx) => {
        if (tx.type !== 'debit') return false;
        if (!tx.payee) return false;
        return tx.payee.trim().toLowerCase() === activeTab.trim().toLowerCase();
      });
    }
  }, [cardTxs, activeTab]);

  const groupedTxs = useMemo(() => {
    const groups: { [key: string]: CardTransaction[] } = {};
    const sorted = [...filteredTxs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
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
  }, [filteredTxs]);

  const bgColor = theme.colors.background;
  const textColor = isDark ? '#FFFFFF' : '#202020';
  const subColor = isDark ? '#A1A1A1' : '#7A7A7A';

  const cardLabel = card.nickname.trim() || (card.type === 'Credit' ? 'Credit Card' : 'Debit Card');

  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [unflagDialog, setUnflagDialog] = useState<CardTransaction | null>(null);

  const handleDelete = (id: string) => {
    setDeleteDialog(id);
  };

  const daysUntilBilling = useMemo(() => {
    if (!card.billingDate) return null;
    const today = new Date();
    const todayDate = today.getDate();
    const billingDay = card.billingDate;
    if (todayDate === billingDay) return 0;
    const next = new Date(today.getFullYear(), today.getMonth(), billingDay);
    if (next <= today) {
      next.setMonth(next.getMonth() + 1);
    }
    const diffMs = next.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }, [card.billingDate]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setIsLoading(false);
    });
  }, []);

  const palette = getCardColors(card.color);

  if (isLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: bgColor, paddingTop: 0 }]}>
        <Appbar.Header style={{ backgroundColor: bgColor }}>
          <Appbar.BackAction onPress={onBack} />
          <Appbar.Content title={cardLabel} titleStyle={{ fontWeight: '700', fontFamily: 'SpaceGrotesk', textAlign: 'center' }} />
        </Appbar.Header>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: bgColor, paddingTop: 0 }]}>
      {/* ── Header ── */}
      <Appbar.Header style={{ backgroundColor: bgColor }}>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title={cardLabel} titleStyle={{ fontWeight: '700', fontFamily: 'SpaceGrotesk', textAlign: 'center' }} />
        <Menu
          visible={cycleMenuVisible}
          onDismiss={() => setCycleMenuVisible(false)}
          anchor={
            <Appbar.Action icon="calendar" onPress={() => setCycleMenuVisible(true)} />
          }
          contentStyle={{ backgroundColor: theme.colors.surface }}
        >
          {cardCycles.map(c => (
            <Menu.Item 
              key={c.id} 
              onPress={() => {
                setActiveCycleId(c.id);
                setCycleMenuVisible(false);
              }} 
              title={c.name}
              titleStyle={{ 
                color: activeCycleId === c.id ? theme.colors.primary : theme.colors.onSurface, 
                fontWeight: activeCycleId === c.id ? '700' : '400',
                fontFamily: 'SpaceGrotesk'
              }}
              leadingIcon={activeCycleId === c.id ? "check" : "circle-outline"}
            />
          ))}
          <Menu.Item 
            onPress={() => {
              setCycleMenuVisible(false);
              const now = new Date();
              setNewCycleName(now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
              setNewCycleDialog(true);
            }} 
            title="Start New Cycle"
            titleStyle={{ fontFamily: 'SpaceGrotesk' }}
            leadingIcon="plus"
          />
          {cardCycles.length > 0 && (
            <Menu.Item 
              onPress={() => {
                setCycleMenuVisible(false);
                setDeleteCycleNameInput('');
                setDeleteCycleDialogMode(true);
              }} 
              title="Delete Current Cycle"
              titleStyle={{ fontFamily: 'SpaceGrotesk', color: theme.colors.error }}
              leadingIcon="delete"
            />
          )}
        </Menu>
      </Appbar.Header>

      <FlingGestureHandler
        direction={Directions.LEFT}
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.ACTIVE) handleFlingLeft();
        }}
      >
        <FlingGestureHandler
          direction={Directions.RIGHT}
          onHandlerStateChange={({ nativeEvent }) => {
            if (nativeEvent.state === State.ACTIVE) handleFlingRight();
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={{ marginTop: 8 }}>
              <FlatList
                ref={listRef}
                data={cardCycles}
                keyExtractor={c => c.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={SCREEN_W}
                snapToAlignment="start"
                decelerationRate="fast"
                onScrollToIndexFailed={info => {
                  setTimeout(() => {
                    listRef.current?.scrollToIndex({ index: info.index, animated: false });
                  }, 50);
                }}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
                  const newCycle = cardCycles[index];
                  if (newCycle && newCycle.id !== activeCycleId) {
                    setActiveCycleId(newCycle.id);
                  }
                }}
                renderItem={({ item: cycle }) => (
                  <CycleCard 
                    cycle={cycle} 
                    transactions={transactions} 
                    card={card} 
                    daysUntilBilling={daysUntilBilling} 
                    palette={palette} 
                    fmt={fmt}
                    theme={theme}
                  />
                )}
              />
            </View>


      {/* ── Dynamic Tabs ── */}
      <View style={{ marginHorizontal: 16, marginBottom: 12, marginTop: 4 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: isActive
                    ? theme.colors.primaryContainer
                    : theme.colors.surface,
                  borderWidth: isActive ? 0 : 1,
                  borderColor: theme.colors.outlineVariant,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: isActive ? '700' : '500',
                    fontFamily: 'SpaceGrotesk',
                    color: isActive
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSurfaceVariant,
                  }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isTransitioning ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
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

        {filteredTxs.length === 0 && (
          <View style={styles.empty}>
            <Avatar.Icon size={64} icon="receipt" style={{ backgroundColor: theme.colors.surfaceVariant, marginBottom: 16 }} color={theme.colors.primary} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              {cardTxs.length === 0
                ? 'No transactions yet'
                : activeTab === 'All'
                ? 'No transactions found'
                : activeTab === 'Payment Made'
                ? 'No payments made yet'
                : activeTab === 'Me'
                ? 'No transactions for Me yet'
                : `No transactions for ${activeTab} yet`}
            </Text>
            <Text style={[styles.emptySubtitle, { color: subColor }]}>
              Tap the + button to add your first entry
            </Text>
          </View>
        )}
      </ScrollView>
      )}
      </View>
      </FlingGestureHandler>
      </FlingGestureHandler>

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
        billingCycleId={activeCycleId}
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

        <Dialog visible={newCycleDialog} onDismiss={() => setNewCycleDialog(false)} style={{ backgroundColor: theme.colors.surface }}>
          <Dialog.Title style={{ color: theme.colors.onSurface }}>Start New Cycle</Dialog.Title>
          <Dialog.Content>
            <PaperInput
              mode="outlined"
              label="Cycle Name"
              value={newCycleName}
              onChangeText={setNewCycleName}
              placeholder="e.g. Nov 2026"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setNewCycleDialog(false)}>Cancel</Button>
            <Button 
              onPress={() => {
                const name = newCycleName.trim();
                if (name) {
                  const isDuplicate = cardCycles.some(c => c.name.toLowerCase() === name.toLowerCase());
                  if (isDuplicate) {
                    Alert.alert('Duplicate Name', 'A billing cycle with this name already exists.');
                    return;
                  }

                  addBillingCycle({
                    cardId: card.id,
                    name,
                    startDate: new Date().toISOString(),
                    isClosed: false,
                  });
                  newlyCreatedRef.current = true;
                  setNewCycleDialog(false);
                }
              }}
            >
              Create
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={deleteCycleDialogMode} onDismiss={() => setDeleteCycleDialogMode(false)} style={{ backgroundColor: theme.colors.surface }}>
          <Dialog.Title style={{ color: theme.colors.onSurface }}>Delete Cycle</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
              Are you sure you want to delete this cycle? All transactions in this cycle will be lost.{'\n\n'}
              <Text style={{ color: theme.colors.error, fontWeight: '700' }}>
                Type "{cardCycles.find(c => c.id === activeCycleId)?.name}" to confirm.
              </Text>
            </Text>
            <PaperInput
              mode="outlined"
              label="Cycle Name"
              value={deleteCycleNameInput}
              onChangeText={setDeleteCycleNameInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteCycleDialogMode(false)}>Cancel</Button>
            <Button 
              textColor={theme.colors.error}
              disabled={deleteCycleNameInput.trim().toLowerCase() !== cardCycles.find(c => c.id === activeCycleId)?.name.toLowerCase()}
              onPress={() => {
                if (activeCycleId) {
                  deleteBillingCycle(activeCycleId);
                  setActiveCycleId(null);
                  setDeleteCycleDialogMode(false);
                }
              }}
            >
              Delete
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
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.1)',
  },
  glow1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -80,
    right: -50,
    opacity: 0.18,
  },
  glow2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: -70,
    left: -40,
    opacity: 0.12,
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
