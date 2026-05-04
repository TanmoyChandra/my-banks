import { BANKS } from '../constants/banks';

export interface QRExtractionResult {
  name: string | null;
  bankName: string | null;
  upiId: string | null;
  qrValue: string;
}

const UPI_ID_REGEX = /[a-zA-Z0-9._-]+@[a-zA-Z]+[a-zA-Z0-9._-]*/;
const NAME_LABEL_REGEX = /(?:name|a\/c name|account holder)\s*:?\s*([a-zA-Z][a-zA-Z ]{2,60})/i;
const BANK_WORD_REGEX = /^([a-zA-Z ]*(?:bank|payments bank|finance|nbfc)[a-zA-Z ]*)$/i;

const UPI_HANDLE_BANKS: Record<string, string> = {
  oksbi: 'State Bank of India',
  sbi: 'State Bank of India',
  okhdfcbank: 'HDFC Bank',
  hdfcbank: 'HDFC Bank',
  okicici: 'ICICI Bank',
  icici: 'ICICI Bank',
  okaxis: 'Axis Bank',
  axisbank: 'Axis Bank',
  okaxisbank: 'Axis Bank',
  kotak: 'Kotak Mahindra Bank',
  okkotak: 'Kotak Mahindra Bank',
  pnb: 'Punjab National Bank',
  barodampay: 'Bank of Baroda',
  unionbank: 'Union Bank of India',
  canarabank: 'Canara Bank',
  indus: 'IndusInd Bank',
  yesbank: 'Yes Bank',
  idfcfirst: 'IDFC FIRST Bank',
  centralbank: 'Central Bank of India',
  indianbank: 'Indian Bank',
  boi: 'Bank of India',
  bankofindia: 'Bank of India',
};

const cleanText = (value?: string | null) => {
  if (!value) return null;
  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned || null;
};

const parseQRParams = (qrValue: string) => {
  const queryIndex = qrValue.indexOf('?');
  if (queryIndex === -1) return new URLSearchParams();
  return new URLSearchParams(qrValue.slice(queryIndex + 1));
};

const extractUPIId = (qrValue: string, ocrText?: string | null) => {
  const params = parseQRParams(qrValue);
  const paramUPI = cleanText(params.get('pa'));
  if (paramUPI) return paramUPI;

  return (qrValue.match(UPI_ID_REGEX) || ocrText?.match(UPI_ID_REGEX) || [null])[0];
};

const normalizeBank = (text: string) => {
  const lower = text.toLowerCase();
  return BANKS.find(bank => {
    const bankName = bank.name.toLowerCase();
    return lower.includes(bankName) || bankName.includes(lower);
  })?.name || cleanText(text);
};

const extractBankFromHandle = (upiId?: string | null) => {
  const handle = upiId?.split('@')[1]?.toLowerCase();
  if (!handle) return null;
  return UPI_HANDLE_BANKS[handle] || null;
};

const extractBankFromText = (text: string) => {
  const normalizedText = text.replace(/\s+/g, ' ');
  const knownBank = BANKS.find(bank => normalizedText.toLowerCase().includes(bank.name.toLowerCase()));
  if (knownBank) return knownBank.name;

  for (const line of text.split(/\r?\n/)) {
    const bankMatch = cleanText(line)?.match(BANK_WORD_REGEX)?.[1];
    if (bankMatch) return normalizeBank(bankMatch);
  }

  return null;
};

const extractNameFromText = (text: string) => {
  const labeledName = cleanText(text.match(NAME_LABEL_REGEX)?.[1]);
  if (labeledName && !shouldRejectName(labeledName)) return titleCase(labeledName);

  const candidates = text
    .split(/\r?\n/)
    .map(line => cleanText(line))
    .filter((line): line is string => Boolean(line))
    .filter(line => /^[a-zA-Z]+(?: [a-zA-Z]+){1,2}$/.test(line))
    .filter(line => !shouldRejectName(line));

  return candidates[0] ? titleCase(candidates[0]) : null;
};

const shouldRejectName = (value: string) => {
  return /\d|[@:_-]|BANK|PAY|UPI|ACCOUNT|SCAN|QR|POWERED|SWITCH/i.test(value);
};

const titleCase = (value: string) => {
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, char => char.toUpperCase());
};

export const extractQRData = (qrValue: string, ocrText?: string | null): QRExtractionResult => {
  const params = parseQRParams(qrValue);
  const upiId = extractUPIId(qrValue, ocrText);
  const rawName = cleanText(params.get('pn'));
  const name = rawName ? titleCase(rawName) : ocrText ? extractNameFromText(ocrText) : null;
  const bankName = extractBankFromText(ocrText || '') || extractBankFromHandle(upiId) || extractBankFromText(qrValue);

  return {
    name,
    bankName,
    upiId,
    qrValue,
  };
};
