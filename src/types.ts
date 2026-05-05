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
  bankName: string;
  holderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  nickname: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  accountType: 'Savings' | 'Current';
  branchName: string;
}

export type TabType = 'qr' | 'cards' | 'accounts';
export type DrawerScreen = 'setup-qr' | 'setup-cards' | 'setup-accounts' | null;
