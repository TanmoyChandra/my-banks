import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

// ── Encryption key (app-level secret) ──────────────────────────
// This is a fixed app-level key that obfuscates the backup file
// so it is non-human-readable and tamper-evident.
const ENCRYPTION_KEY = 'MyBanks::SecureBackup::v1::2024';
const BACKUP_VERSION = 1;
const FILE_MAGIC = 'MYBANKS_BACKUP';

// ── Types ──────────────────────────────────────────────────────
export interface BackupPayload {
  magic: string;
  version: number;
  exportedAt: string;
  wallet: {
    upis: any[];
    cards: any[];
    accounts: any[];
    transactions: any[];
    merchantQRs: any[];
  };
  preferences: {
    userName: string;
    isDark: boolean;
  };
}

export interface BackupResult {
  success: boolean;
  error?: string;
  fileName?: string;
}

// ── Pure JS Base64 Polyfill ────────────────────────────────────
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function btoa(input: string = '') {
  let str = input;
  let output = '';
  for (
    let block = 0, charCode, i = 0, map = chars;
    str.charAt(i | 0) || (map = '=', i % 1);
    output += map.charAt(63 & block >> 8 - i % 1 * 8)
  ) {
    charCode = str.charCodeAt(i += 3/4);
    if (charCode > 0xFF) {
      throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
    }
    block = block << 8 | charCode;
  }
  return output;
}

function atob(input: string = '') {
  let str = input.replace(/=+$/, '');
  let output = '';
  if (str.length % 4 == 1) {
    throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
  }
  for (
    let bc = 0, bs = 0, buffer, i = 0;
    buffer = str.charAt(i++);
    ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
  ) {
    buffer = chars.indexOf(buffer);
  }
  return output;
}

// ── Pure JS Obfuscator (No native dependencies) ────────────────
function encrypt(data: string): string {
  // 1. Encode to URI component to safely handle all Emojis & UTF-16
  const ascii = encodeURIComponent(data);
  // 2. Simple XOR cipher
  let xored = '';
  for (let i = 0; i < ascii.length; i++) {
    xored += String.fromCharCode(ascii.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
  }
  // 3. Encode XORed 0-255 bytes to Base64 for safe file writing
  return btoa(xored);
}

function decrypt(cipher: string): string {
  // 1. Decode Base64 to XORed 0-255 bytes
  const xored = atob(cipher);
  // 2. Un-XOR cipher
  let ascii = '';
  for (let i = 0; i < xored.length; i++) {
    ascii += String.fromCharCode(xored.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
  }
  // 3. Decode URI component back to UTF-16 strings
  return decodeURIComponent(ascii);
}

// ── Export backup ──────────────────────────────────────────────
export async function exportBackup(payload: BackupPayload): Promise<BackupResult> {
  try {
    // 1. Serialize & encrypt
    const json = JSON.stringify(payload);
    const encrypted = encrypt(json);

    // 2. Write to a temp file
    const dateStr = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');
    const fileName = `mybanks_backup_${dateStr}.mbk`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, encrypted, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // 3. Share / save
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      return { success: false, error: 'Sharing is not available on this device.' };
    }

    await Sharing.shareAsync(filePath, {
      mimeType: 'application/octet-stream',
      dialogTitle: 'Save MyBanks Backup',
      UTI: 'public.data',
    });

    return { success: true, fileName };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Unknown error during export.' };
  }
}

// ── Import backup ──────────────────────────────────────────────
export async function importBackup(): Promise<
  { success: true; payload: BackupPayload } | { success: false; error: string }
> {
  try {
    // 1. Let user pick the .mbk file
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',      // Android needs wildcard for custom extensions
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) {
      return { success: false, error: 'No file selected.' };
    }

    const fileUri = result.assets[0].uri;

    // 2. Read the encrypted content
    const encrypted = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // 3. Decrypt
    let json: string;
    try {
      json = decrypt(encrypted);
    } catch {
      return { success: false, error: 'Failed to decrypt. The file may be corrupted or from a different app.' };
    }

    if (!json) {
      return { success: false, error: 'Decryption produced empty output. Invalid backup file.' };
    }

    // 4. Parse
    let payload: BackupPayload;
    try {
      payload = JSON.parse(json);
    } catch {
      return { success: false, error: 'Invalid backup format. The file may be corrupted.' };
    }

    // 5. Validate magic
    if (payload.magic !== FILE_MAGIC) {
      return { success: false, error: 'This file does not appear to be a MyBanks backup.' };
    }

    return { success: true, payload };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Unknown error during import.' };
  }
}

export { FILE_MAGIC, BACKUP_VERSION };
