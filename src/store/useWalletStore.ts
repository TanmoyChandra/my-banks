import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QREntry, CardEntry, BankAccount } from '../types';

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface WalletState {
  upis: QREntry[];
  cards: CardEntry[];
  accounts: BankAccount[];

  addUpi: (entry: Omit<QREntry, 'id'>) => void;
  updateUpi: (id: string, entry: Omit<QREntry, 'id'>) => void;
  deleteUpi: (id: string) => void;

  addCard: (card: Omit<CardEntry, 'id'>) => void;
  updateCard: (id: string, card: Omit<CardEntry, 'id'>) => void;
  deleteCard: (id: string) => void;

  addAccount: (account: Omit<BankAccount, 'id'>) => void;
  updateAccount: (id: string, account: Omit<BankAccount, 'id'>) => void;
  deleteAccount: (id: string) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      upis: [],
      cards: [],
      accounts: [],

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
        set((s) => ({ cards: s.cards.filter((c) => c.id !== id) })),

      // Account CRUD
      addAccount: (account) =>
        set((s) => ({ accounts: [...s.accounts, { ...account, id: generateId() }] })),
      updateAccount: (id, account) =>
        set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...account, id } : a)) })),
      deleteAccount: (id) =>
        set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),
    }),
    {
      name: 'mybanks-wallet',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
