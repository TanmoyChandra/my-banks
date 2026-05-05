import { ImageSourcePropType } from 'react-native';

export interface Bank {
  slug: string;
  name: string;
  logo: ImageSourcePropType;
  symbol: ImageSourcePropType;
}

export const BANKS: Bank[] = [
  { slug: 'airp', name: 'Airtel Payments Bank', logo: require('../../assets/bank-logos/airp/logo.png'), symbol: require('../../assets/bank-logos/airp/symbol.png') },
  { slug: 'aubl', name: 'AU Small Finance Bank Limited', logo: require('../../assets/bank-logos/aubl/logo.png'), symbol: require('../../assets/bank-logos/aubl/symbol.png') },
  { slug: 'barb', name: 'Bank of Baroda', logo: require('../../assets/bank-logos/barb/logo.png'), symbol: require('../../assets/bank-logos/barb/symbol.png') },
  { slug: 'bdbl', name: 'Bandhan Bank', logo: require('../../assets/bank-logos/bdbl/logo.png'), symbol: require('../../assets/bank-logos/bdbl/symbol.png') },
  { slug: 'bkid', name: 'Bank of India', logo: require('../../assets/bank-logos/bkid/logo.png'), symbol: require('../../assets/bank-logos/bkid/symbol.png') },
  { slug: 'cbin', name: 'Central Bank of India', logo: require('../../assets/bank-logos/cbin/logo.png'), symbol: require('../../assets/bank-logos/cbin/symbol.png') },
  { slug: 'ciub', name: 'City Union Bank', logo: require('../../assets/bank-logos/ciub/logo.png'), symbol: require('../../assets/bank-logos/ciub/symbol.png') },
  { slug: 'cnrb', name: 'Canara Bank', logo: require('../../assets/bank-logos/cnrb/logo.png'), symbol: require('../../assets/bank-logos/cnrb/symbol.png') },
  { slug: 'csbk', name: 'CSB Bank Limited', logo: require('../../assets/bank-logos/csbk/logo.png'), symbol: require('../../assets/bank-logos/csbk/symbol.png') },
  { slug: 'dcbl', name: 'DCB Bank Limited', logo: require('../../assets/bank-logos/dcbl/logo.png'), symbol: require('../../assets/bank-logos/dcbl/symbol.png') },
  { slug: 'dlxb', name: 'Dhanalakshmi Bank', logo: require('../../assets/bank-logos/dlxb/logo.png'), symbol: require('../../assets/bank-logos/dlxb/symbol.png') },
  { slug: 'esmf', name: 'ESAF Small Finance Bank', logo: require('../../assets/bank-logos/esmf/logo.png'), symbol: require('../../assets/bank-logos/esmf/symbol.png') },
  { slug: 'fdrl', name: 'Federal Bank', logo: require('../../assets/bank-logos/fdrl/logo.png'), symbol: require('../../assets/bank-logos/fdrl/symbol.png') },
  { slug: 'hdfc', name: 'HDFC Bank', logo: require('../../assets/bank-logos/hdfc/logo.png'), symbol: require('../../assets/bank-logos/hdfc/symbol.png') },
  { slug: 'ibkl', name: 'IDBI Bank', logo: require('../../assets/bank-logos/ibkl/logo.png'), symbol: require('../../assets/bank-logos/ibkl/symbol.png') },
  { slug: 'icic', name: 'ICICI Bank Limited', logo: require('../../assets/bank-logos/icic/logo.png'), symbol: require('../../assets/bank-logos/icic/symbol.png') },
  { slug: 'idfb', name: 'IDFC First Bank Limited', logo: require('../../assets/bank-logos/idfb/logo.png'), symbol: require('../../assets/bank-logos/idfb/symbol.png') },
  { slug: 'idib', name: 'Indian Bank', logo: require('../../assets/bank-logos/idib/logo.png'), symbol: require('../../assets/bank-logos/idib/symbol.png') },
  { slug: 'indb', name: 'IndusInd Bank', logo: require('../../assets/bank-logos/indb/logo.png'), symbol: require('../../assets/bank-logos/indb/symbol.png') },
  { slug: 'ioba', name: 'Indian Overseas Bank', logo: require('../../assets/bank-logos/ioba/logo.png'), symbol: require('../../assets/bank-logos/ioba/symbol.png') },
  { slug: 'jaka', name: 'Jammu and Kashmir Bank', logo: require('../../assets/bank-logos/jaka/logo.png'), symbol: require('../../assets/bank-logos/jaka/symbol.png') },
  { slug: 'jiop', name: 'Jio Payments Bank', logo: require('../../assets/bank-logos/jiop/logo.png'), symbol: require('../../assets/bank-logos/jiop/symbol.png') },
  { slug: 'karb', name: 'Karnataka Bank Limited', logo: require('../../assets/bank-logos/karb/logo.png'), symbol: require('../../assets/bank-logos/karb/symbol.png') },
  { slug: 'kkbk', name: 'Kotak Mahindra Bank Limited', logo: require('../../assets/bank-logos/kkbk/logo.png'), symbol: require('../../assets/bank-logos/kkbk/symbol.png') },
  { slug: 'kvbl', name: 'Karur Vysya Bank', logo: require('../../assets/bank-logos/kvbl/logo.png'), symbol: require('../../assets/bank-logos/kvbl/symbol.png') },
  { slug: 'mahb', name: 'Bank of Maharashtra', logo: require('../../assets/bank-logos/mahb/logo.png'), symbol: require('../../assets/bank-logos/mahb/symbol.png') },
  { slug: 'ntbl', name: 'The Nainital Bank Limited', logo: require('../../assets/bank-logos/ntbl/logo.png'), symbol: require('../../assets/bank-logos/ntbl/symbol.png') },
  { slug: 'psib', name: 'Punjab and Sind Bank', logo: require('../../assets/bank-logos/psib/logo.png'), symbol: require('../../assets/bank-logos/psib/symbol.png') },
  { slug: 'punb', name: 'Punjab National Bank', logo: require('../../assets/bank-logos/punb/logo.png'), symbol: require('../../assets/bank-logos/punb/symbol.png') },
  { slug: 'pytm', name: 'Paytm Payments Bank', logo: require('../../assets/bank-logos/pytm/logo.png'), symbol: require('../../assets/bank-logos/pytm/symbol.png') },
  { slug: 'ratn', name: 'RBL Bank Limited', logo: require('../../assets/bank-logos/ratn/logo.png'), symbol: require('../../assets/bank-logos/ratn/symbol.png') },
  { slug: 'sbin', name: 'State Bank of India', logo: require('../../assets/bank-logos/sbin/logo.png'), symbol: require('../../assets/bank-logos/sbin/symbol.png') },
  { slug: 'scbl', name: 'Standard Chartered Bank', logo: require('../../assets/bank-logos/scbl/logo.png'), symbol: require('../../assets/bank-logos/scbl/symbol.png') },
  { slug: 'sibl', name: 'South Indian Bank', logo: require('../../assets/bank-logos/sibl/logo.png'), symbol: require('../../assets/bank-logos/sibl/symbol.png') },
  { slug: 'slice', name: 'Slice SF Bank', logo: require('../../assets/bank-logos/slice/logo.png'), symbol: require('../../assets/bank-logos/slice/symbol.png') },
  { slug: 'tmbl', name: 'Tamilnad Mercantile Bank Limited', logo: require('../../assets/bank-logos/tmbl/logo.png'), symbol: require('../../assets/bank-logos/tmbl/symbol.png') },
  { slug: 'ubin', name: 'Union Bank of India', logo: require('../../assets/bank-logos/ubin/logo.png'), symbol: require('../../assets/bank-logos/ubin/symbol.png') },
  { slug: 'ucba', name: 'UCO Bank', logo: require('../../assets/bank-logos/ucba/logo.png'), symbol: require('../../assets/bank-logos/ucba/symbol.png') },
  { slug: 'ujvn', name: 'Ujjivan Small Finance Bank Ltd', logo: require('../../assets/bank-logos/ujvn/logo.png'), symbol: require('../../assets/bank-logos/ujvn/symbol.png') },
  { slug: 'utib', name: 'Axis Bank', logo: require('../../assets/bank-logos/utib/logo.png'), symbol: require('../../assets/bank-logos/utib/symbol.png') },
  { slug: 'yesb', name: 'Yes Bank', logo: require('../../assets/bank-logos/yesb/logo.png'), symbol: require('../../assets/bank-logos/yesb/symbol.png') },
];

export const findBankByName = (bankName?: string | null) => {
  if (!bankName) return undefined;
  const normalized = bankName.toLowerCase().replace(/\blimited\b/g, '').trim();

  // 1. Try exact match first
  const exact = BANKS.find(bank => {
    const normalizedBank = bank.name.toLowerCase().replace(/\blimited\b/g, '').trim();
    return normalizedBank === normalized;
  });
  if (exact) return exact;

  // 2. Try fuzzy match (inclusion)
  return BANKS.find(bank => {
    const normalizedBank = bank.name.toLowerCase().replace(/\blimited\b/g, '').trim();
    return normalizedBank.includes(normalized) || normalized.includes(normalizedBank);
  });
};
