import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QREntry, CardEntry, BankAccount, CardTransaction, MerchantQR } from '../types';
import { encryptLocal, decryptLocal } from '../utils/crypto';

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface WalletState {
  upis: QREntry[];
  cards: CardEntry[];
  accounts: BankAccount[];
  transactions: CardTransaction[];
  merchantQRs: MerchantQR[];

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

  // Merchant QR CRUD
  addMerchantQR: (entry: Omit<MerchantQR, 'id'>) => void;
  updateMerchantQR: (id: string, entry: Omit<MerchantQR, 'id'>) => void;
  deleteMerchantQR: (id: string) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      upis: [],
      cards: [],
      accounts: [],
      transactions: [],
      merchantQRs: [],

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
          // also purge all transactions for the deleted card
          transactions: s.transactions.filter((t) => t.cardId !== id),
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

      // Merchant QR CRUD
      addMerchantQR: (entry) =>
        set((s) => ({ merchantQRs: [...s.merchantQRs, { ...entry, id: generateId() }] })),
      updateMerchantQR: (id, entry) =>
        set((s) => ({ merchantQRs: s.merchantQRs.map((m) => (m.id === id ? { ...entry, id } : m)) })),
      deleteMerchantQR: (id) =>
        set((s) => ({ merchantQRs: s.merchantQRs.filter((m) => m.id !== id) })),
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
