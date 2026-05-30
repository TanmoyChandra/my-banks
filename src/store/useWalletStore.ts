import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QREntry, CardEntry, BankAccount, CardTransaction, MerchantQR, BillingCycle } from '../types';
import { encryptLocal, decryptLocal } from '../utils/crypto';

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface WalletState {
  upis: QREntry[];
  cards: CardEntry[];
  accounts: BankAccount[];
  transactions: CardTransaction[];
  merchantQRs: MerchantQR[];
  payees: string[];
  billingCycles: BillingCycle[];

  addUpi: (entry: Omit<QREntry, 'id'>) => void;
  updateUpi: (id: string, entry: Omit<QREntry, 'id'>) => void;
  deleteUpi: (id: string) => void;

  addCard: (card: Omit<CardEntry, 'id'>) => void;
  updateCard: (id: string, card: Omit<CardEntry, 'id'>) => void;
  deleteCard: (id: string) => void;

  addAccount: (account: Omit<BankAccount, 'id'>) => void;
  updateAccount: (id: string, account: Omit<BankAccount, 'id'>) => void;
  deleteAccount: (id: string) => void;

  // Transaction CRUD (per card)
  addTransaction: (tx: Omit<CardTransaction, 'id'>) => void;
  updateTransaction: (id: string, tx: Omit<CardTransaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  getTransactionsForCard: (cardId: string) => CardTransaction[];
  migrateLegacyTransactionsForCard: (cardId: string) => void;

  // Billing Cycles CRUD
  addBillingCycle: (cycle: Omit<BillingCycle, 'id'>) => void;
  updateBillingCycle: (id: string, cycle: Omit<BillingCycle, 'id'>) => void;
  deleteBillingCycle: (id: string) => void;

  // Merchant QR CRUD
  addMerchantQR: (entry: Omit<MerchantQR, 'id'>) => void;
  updateMerchantQR: (id: string, entry: Omit<MerchantQR, 'id'>) => void;
  deleteMerchantQR: (id: string) => void;

  // Payees
  addPayee: (name: string) => void;
  removePayee: (name: string) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      upis: [],
      cards: [],
      accounts: [],
      transactions: [],
      merchantQRs: [],
      payees: ['Me'],
      billingCycles: [],

      // UPI CRUD
      addUpi: (entry) =>
        set((s) => ({ upis: [...s.upis, { ...entry, id: generateId() }] })),
      updateUpi: (id, entry) =>
        set((s) => ({ upis: s.upis.map((e) => (e.id === id ? { ...entry, id } : e)) })),
      deleteUpi: (id) =>
        set((s) => ({ upis: s.upis.filter((e) => e.id !== id) })),

      // Card CRUD
      addCard: (card) =>
        set((s) => ({ cards: [...s.cards, { ...card, id: generateId() }] })),
      updateCard: (id, card) =>
        set((s) => ({ cards: s.cards.map((c) => (c.id === id ? { ...card, id } : c)) })),
      deleteCard: (id) =>
        set((s) => ({
          cards: s.cards.filter((c) => c.id !== id),
          // also purge all transactions and billing cycles for the deleted card
          transactions: s.transactions.filter((t) => t.cardId !== id),
          billingCycles: s.billingCycles.filter((b) => b.cardId !== id),
        })),

      // Account CRUD
      addAccount: (account) =>
        set((s) => ({ accounts: [...s.accounts, { ...account, id: generateId() }] })),
      updateAccount: (id, account) =>
        set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...account, id } : a)) })),
      deleteAccount: (id) =>
        set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),

      // Transaction CRUD
      addTransaction: (tx) =>
        set((s) => ({ transactions: [{ ...tx, id: generateId() }, ...s.transactions] })),
      updateTransaction: (id, tx) =>
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === id ? { ...tx, id } : t)),
        })),
      deleteTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
      getTransactionsForCard: (cardId) =>
        get().transactions.filter((t) => t.cardId === cardId),
      migrateLegacyTransactionsForCard: (cardId) =>
        set((s) => {
          const cardTxs = s.transactions.filter(t => t.cardId === cardId);
          const legacyTxs = cardTxs.filter(t => !t.billingCycleId);
          if (legacyTxs.length === 0) return s; // Nothing to migrate
          
          const newCycle: BillingCycle = {
            id: generateId(),
            cardId,
            name: 'Initial Cycle',
            startDate: new Date().toISOString(),
            isClosed: false,
          };
          
          return {
            billingCycles: [...s.billingCycles, newCycle],
            transactions: s.transactions.map(t => 
              (t.cardId === cardId && !t.billingCycleId) ? { ...t, billingCycleId: newCycle.id } : t
            )
          };
        }),

      // Billing Cycle CRUD
      addBillingCycle: (cycle) =>
        set((s) => ({ billingCycles: [{ ...cycle, id: generateId() }, ...s.billingCycles] })),
      updateBillingCycle: (id, cycle) =>
        set((s) => ({ billingCycles: s.billingCycles.map((b) => (b.id === id ? { ...cycle, id } : b)) })),
      deleteBillingCycle: (id) =>
        set((s) => ({ 
          billingCycles: s.billingCycles.filter((b) => b.id !== id),
          transactions: s.transactions.filter((t) => t.billingCycleId !== id),
        })),

      // Merchant QR CRUD
      addMerchantQR: (entry) =>
        set((s) => ({ merchantQRs: [...s.merchantQRs, { ...entry, id: generateId() }] })),
      updateMerchantQR: (id, entry) =>
        set((s) => ({ merchantQRs: s.merchantQRs.map((m) => (m.id === id ? { ...entry, id } : m)) })),
      deleteMerchantQR: (id) =>
        set((s) => ({ merchantQRs: s.merchantQRs.filter((m) => m.id !== id) })),

      // Payees
      addPayee: (name) =>
        set((s) => ({ payees: s.payees.includes(name) ? s.payees : [...s.payees, name] })),
      removePayee: (name) =>
        set((s) => ({ payees: s.payees.filter((p) => p !== name) })),
    }),
    {
      name: 'mybanks-wallet',
      storage: createJSONStorage(() => ({
        getItem: async (name: string) => {
          const value = await AsyncStorage.getItem(name);
          return value ? decryptLocal(value) : null;
        },
        setItem: async (name: string, value: string) => {
          await AsyncStorage.setItem(name, encryptLocal(value));
        },
        removeItem: async (name: string) => {
          await AsyncStorage.removeItem(name);
        },
      })),
    }
  )
);
