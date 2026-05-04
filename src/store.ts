import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QREntry, CardEntry, BankAccount } from './types';

const KEYS = {
  qr: 'mybanks_qr',
  cards: 'mybanks_cards',
  accounts: 'mybanks_accounts',
};

export function useStore() {
  const [qrEntries, setQREntries] = useState<QREntry[]>([]);
  const [cards, setCards] = useState<CardEntry[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [qrRaw, cardsRaw, accountsRaw] = await Promise.all([
          AsyncStorage.getItem(KEYS.qr),
          AsyncStorage.getItem(KEYS.cards),
          AsyncStorage.getItem(KEYS.accounts),
        ]);
        if (qrRaw) setQREntries(JSON.parse(qrRaw));
        if (cardsRaw) setCards(JSON.parse(cardsRaw));
        if (accountsRaw) setAccounts(JSON.parse(accountsRaw));
      } catch {}
      setLoaded(true);
    };
    loadAll();
  }, []);

  // Persist to AsyncStorage on changes
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(KEYS.qr, JSON.stringify(qrEntries)).catch(() => {});
  }, [qrEntries, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(KEYS.cards, JSON.stringify(cards)).catch(() => {});
  }, [cards, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(KEYS.accounts, JSON.stringify(accounts)).catch(() => {});
  }, [accounts, loaded]);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // QR CRUD
  const addQR = (entry: Omit<QREntry, 'id'>) => {
    setQREntries(prev => [...prev, { ...entry, id: generateId() }]);
  };
  const updateQR = (id: string, entry: Omit<QREntry, 'id'>) => {
    setQREntries(prev => prev.map(e => e.id === id ? { ...entry, id } : e));
  };
  const deleteQR = (id: string) => {
    setQREntries(prev => prev.filter(e => e.id !== id));
  };

  // Card CRUD
  const addCard = (card: Omit<CardEntry, 'id'>) => {
    setCards(prev => [...prev, { ...card, id: generateId() }]);
  };
  const updateCard = (id: string, card: Omit<CardEntry, 'id'>) => {
    setCards(prev => prev.map(c => c.id === id ? { ...card, id } : c));
  };
  const deleteCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  };

  // Account CRUD
  const addAccount = (account: Omit<BankAccount, 'id'>) => {
    setAccounts(prev => [...prev, { ...account, id: generateId() }]);
  };
  const updateAccount = (id: string, account: Omit<BankAccount, 'id'>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...account, id } : a));
  };
  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  return {
    loaded,
    qrEntries, addQR, updateQR, deleteQR,
    cards, addCard, updateCard, deleteCard,
    accounts, addAccount, updateAccount, deleteAccount,
  };
}
