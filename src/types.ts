export interface QREntry {
  id: string;
  name: string;
  bankName: string;
  upiId: string;
  qrValue: string;
  mobileNumber: string;
  address: string;
  notes: string;
}

export interface CardEntry {
  id: string;
  type: 'Credit' | 'Debit';
  network?: 'Visa' | 'Mastercard' | 'RuPay';
  bankName: string;
  holderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  nickname: string;
  color?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  accountType: 'Savings' | 'Current';
  branchName: string;
  color?: string;
}

export interface CardTransaction {
  id: string;
  cardId: string;
  /** 'debit' = money spent/owed (increases due). 'credit' = payment made (decreases due). */
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  date: string; // ISO date string
  payee?: string; // who this was paid for/by
  isFlagged?: boolean; // whether this transaction is flagged
}

export type TabType = 'qr' | 'cards' | 'accounts';
export type DrawerScreen = 'setup-qr' | 'setup-cards' | 'setup-accounts' | null;

export interface MerchantQR {
  id: string;
  name: string;        // Merchant name e.g. "Swiggy"
  category?: string;   // e.g. "Food", "Fuel"
  upiId?: string;      // Decoded UPI ID if available
  imageUri: string;    // Local image URI from gallery
  notes?: string;
}
