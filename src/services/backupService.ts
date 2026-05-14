import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

const BACKUP_VERSION = 2; // Incremented version for the new robust format
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
  };
  preferences: {
    userName: string;
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

    // Add a custom header to make it invalid as standard base64 if someone tries to easily decode it
    const obfuscatedData = `MYBANKS_SECURE_V2::${base64Data}`;

    await FileSystem.writeAsStringAsync(filePath, obfuscatedData, {
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

    // 3. Extract Base64 and decode natively
    let base64Data = fileContent;
    if (fileContent.startsWith('MYBANKS_SECURE_V2::')) {
      base64Data = fileContent.replace('MYBANKS_SECURE_V2::', '');
    } else {
      // Backwards compatibility with V1 if possible, but V1 JS decryption might fail.
      // If it's V1, the old JS atob would be needed. Since the old backup is broken anyway
      // (per user: "its not working"), we assume they are starting fresh with V2.
      if (!fileContent.startsWith('{') && !fileContent.startsWith('MYBANKS')) {
         // It might be old V1 XOR. We won't support it because V1 was crashing.
      }
    }

    const tempJsonPath = `${FileSystem.cacheDirectory}temp_import.json`;
    try {
      await FileSystem.writeAsStringAsync(tempJsonPath, base64Data, {
        encoding: 'base64',
      });
    } catch {
      return { success: false, error: 'Failed to decode backup file. It may be corrupted.' };
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
