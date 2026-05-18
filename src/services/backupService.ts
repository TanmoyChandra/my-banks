import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

const BACKUP_VERSION = 4; // Version 4 adds hex-safe encryption and payees list
const FILE_MAGIC = 'MYBANKS_BACKUP';

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
    payees?: string[];
  };
  preferences: {
    userName: string;
    userImage?: string;
    isDark: boolean;
    isAppLockEnabled?: boolean;
  };
}

export interface BackupResult {
  success: boolean;
  error?: string;
  fileName?: string;
}

// ── Export backup ──────────────────────────────────────────────
export async function exportBackup(payload: BackupPayload): Promise<BackupResult> {
  try {
    // 1. Process merchant QRs: embed images as Base64 so they survive cross-device restores
    const processedMerchantQRs = await Promise.all(
      payload.wallet.merchantQRs.map(async (qr) => {
        try {
          if (qr.imageUri && !qr.imageUri.startsWith('data:')) {
            const base64 = await FileSystem.readAsStringAsync(qr.imageUri, {
              encoding: 'base64',
            });
            return { ...qr, imageUri: `data:image/jpeg;base64,${base64}` };
          }
        } catch (err) {
          console.warn(`Failed to read image for QR ${qr.id}`, err);
        }
        return qr;
      })
    );

    payload.wallet.merchantQRs = processedMerchantQRs;

    // 2. Serialize Payload
    const json = JSON.stringify(payload);

    // 3. Fast Native Base64 Obfuscation
    // Write JSON to a temp file, then read it back as Base64. 
    // This uses native C++/Java code and prevents JS out-of-memory errors on large backups.
    const tempJsonPath = `${FileSystem.cacheDirectory}temp_export.json`;
    await FileSystem.writeAsStringAsync(tempJsonPath, json, {
      encoding: 'utf8',
    });
    const base64Data = await FileSystem.readAsStringAsync(tempJsonPath, {
      encoding: 'base64',
    });

    // 4. Write final .mbk file
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `mybanks_backup_${dateStr}.mbk`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    // ── Encryption Layer ──
    // We use a multi-phase encryption: 
    // 1. Base64 (already done by FileSystem)
    // 2. Simple character rotation / XOR with a hidden key
    const SECRET_KEY = "MB_SECURE_STORAGE_KEY_2026";
    const encryptedArr = new Array(base64Data.length);
    for (let i = 0; i < base64Data.length; i++) {
      const xored = base64Data.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
      encryptedArr[i] = xored.toString(16).padStart(2, '0');
    }
    const encrypted = encryptedArr.join('');

    const finalData = `MYBANKS_ENCRYPTED_V4::${encrypted}`;

    await FileSystem.writeAsStringAsync(filePath, finalData, {
      encoding: 'utf8',
    });

    // Clean up temp file
    await FileSystem.deleteAsync(tempJsonPath, { idempotent: true });

    // 5. Share / save
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
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) {
      return { success: false, error: 'No file selected.' };
    }

    const fileUri = result.assets[0].uri;

    // 2. Read obfuscated content
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'utf8',
    });

    // 3. Decrypt and decode
    let base64Data = "";
    if (fileContent.startsWith('MYBANKS_ENCRYPTED_V4::')) {
      const encrypted = fileContent.replace('MYBANKS_ENCRYPTED_V4::', '');
      const SECRET_KEY = "MB_SECURE_STORAGE_KEY_2026";
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i += 2) {
        const hexByte = parseInt(encrypted.substring(i, i + 2), 16);
        decrypted += String.fromCharCode(hexByte ^ SECRET_KEY.charCodeAt((i / 2) % SECRET_KEY.length));
      }
      base64Data = decrypted;
    } else if (fileContent.startsWith('MYBANKS_ENCRYPTED_V3::')) {
      // V3 has corruption issues but try to decrypt if possible
      const encrypted = fileContent.replace('MYBANKS_ENCRYPTED_V3::', '');
      const SECRET_KEY = "MB_SECURE_STORAGE_KEY_2026";
      const decryptedArr = new Array(encrypted.length);
      for (let i = 0; i < encrypted.length; i++) {
        decryptedArr[i] = String.fromCharCode(encrypted.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
      }
      base64Data = decryptedArr.join('');
    } else if (fileContent.startsWith('MYBANKS_SECURE_V2::')) {
      // Compatibility with old V2 obfuscation
      base64Data = fileContent.replace('MYBANKS_SECURE_V2::', '');
    } else {
      return { success: false, error: 'Unsupported or corrupted backup format.' };
    }

    const tempJsonPath = `${FileSystem.cacheDirectory}temp_import.json`;
    try {
      await FileSystem.writeAsStringAsync(tempJsonPath, base64Data, {
        encoding: 'base64',
      });
    } catch {
      return { success: false, error: 'Failed to decrypt backup. The file may be tampered with.' };
    }

    const json = await FileSystem.readAsStringAsync(tempJsonPath, {
      encoding: 'utf8',
    });
    
    await FileSystem.deleteAsync(tempJsonPath, { idempotent: true });

    // 4. Parse
    let payload: BackupPayload;
    try {
      payload = JSON.parse(json);
    } catch {
      return { success: false, error: 'Invalid backup format. The file is corrupted.' };
    }

    // 5. Validate magic
    if (payload.magic !== FILE_MAGIC) {
      return { success: false, error: 'This file does not appear to be a MyBanks backup.' };
    }

    // 6. Process merchant QRs: write embedded Base64 images back to local filesystem
    if (payload.wallet.merchantQRs && payload.wallet.merchantQRs.length > 0) {
      const documentsDir = FileSystem.documentDirectory + 'merchant_qrs/';
      await FileSystem.makeDirectoryAsync(documentsDir, { intermediates: true });

      payload.wallet.merchantQRs = await Promise.all(
        payload.wallet.merchantQRs.map(async (qr) => {
          if (qr.imageUri && qr.imageUri.startsWith('data:image')) {
            try {
              // Extract base64 part
              const base64Data = qr.imageUri.split(',')[1];
              const ext = qr.imageUri.split(';')[0].split('/')[1] || 'jpg';
              const localUri = `${documentsDir}${qr.id}.${ext}`;
              
              await FileSystem.writeAsStringAsync(localUri, base64Data, {
                encoding: 'base64',
              });
              
              return { ...qr, imageUri: localUri };
            } catch (err) {
              console.warn(`Failed to restore image for QR ${qr.id}`, err);
            }
          }
          return qr;
        })
      );
    }

    return { success: true, payload };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Unknown error during import.' };
  }
}

export { FILE_MAGIC, BACKUP_VERSION };
