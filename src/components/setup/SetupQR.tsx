import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Appbar, 
  TextInput, 
  Button, 
  Text, 
  List, 
  IconButton, 
  useTheme,
  Surface,
  Avatar,
  ActivityIndicator,
  Portal,
  Dialog
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { WebView } from 'react-native-webview';
import { QREntry } from '../../types';
import BankPicker from '../BankPicker';
import { extractQRData } from '../../utils/qrExtraction';
import { findBankByName } from '../../constants/banks';

interface SetupQRProps {
  entries: QREntry[];
  onAdd: (entry: Omit<QREntry, 'id'>) => void;
  onUpdate: (id: string, entry: Omit<QREntry, 'id'>) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const emptyForm = (): Omit<QREntry, 'id'> => ({
  name: '',
  bankName: '',
  upiId: '',
  qrValue: '',
  mobileNumber: '',
  address: '',
  notes: '',
});

const SCAN_TIMEOUT_MS = 30000;

const SetupQR: React.FC<SetupQRProps> = ({ entries, onAdd, onUpdate, onDelete, onBack }) => {
  const [form, setForm] = useState<Omit<QREntry, 'id'>>(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [bankPickerVisible, setBankPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const pendingImageRef = useRef<string | null>(null);
  const decoderReadyRef = useRef(false);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const theme = useTheme();

  const [dialogState, setDialogState] = useState<{ visible: boolean; title: string; message: string; onConfirm?: () => void }>({ visible: false, title: '', message: '' });

  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
    setDialogState({ visible: true, title, message, onConfirm });
  };

  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const clearScanTimeout = () => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
  };

  const startScanTimeout = () => {
    clearScanTimeout();
    scanTimeoutRef.current = setTimeout(() => {
      pendingImageRef.current = null;
      setLoading(false);
      showAlert('Scan Timed Out', 'The QR decoder did not respond. Please try a clearer image.');
    }, SCAN_TIMEOUT_MS);
  };

  const sendImageToDecoder = (dataUri: string) => {
    if (!decoderReadyRef.current) {
      startScanTimeout();
      pendingImageRef.current = dataUri;
      return;
    }

    startScanTimeout();
    const escapedDataUri = JSON.stringify(dataUri);
    webViewRef.current?.injectJavaScript(`
      window.scanQRCode(${escapedDataUri});
      true;
    `);
  };

  const handleSave = () => {
    if (!form.upiId.trim() && !form.qrValue.trim()) {
      showAlert('Required Fields', 'Please enter a UPI ID or scan a QR code.');
      return;
    }
    const qrValue = form.qrValue.trim() || `upi://pay?pa=${encodeURIComponent(form.upiId.trim())}&pn=${encodeURIComponent(form.name.trim() || form.bankName.trim())}&cu=INR`;
    const entry = { ...form, qrValue };
    if (editId) {
      onUpdate(editId, entry);
    } else {
      onAdd(entry);
    }
    handleCancel();
  };

  const handleEdit = (entry: QREntry) => {
    setForm({
      ...emptyForm(),
      ...entry,
    });
    setEditId(entry.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setForm(emptyForm());
    setEditId(null);
    setShowForm(false);
    pendingImageRef.current = null;
    clearScanTimeout();
    setLoading(false);
  };

  const pickAndScan = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'Gallery access is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        setLoading(true);
        
        // Downscale image heavily for fast QR scanning
        const manipulated = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 600 } }], // QR codes work perfectly at 600px
          { format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        if (manipulated.base64) {
          const dataUri = `data:image/jpeg;base64,${manipulated.base64}`;
          sendImageToDecoder(dataUri);
        } else {
          setLoading(false);
          showAlert('Scan Failed', 'Could not read the selected image.');
        }
      }
    } catch (e) {
      pendingImageRef.current = null;
      clearScanTimeout();
      setLoading(false);
      showAlert('Error', 'Failed to pick image.');
    }
  };

  const onWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ready') {
        decoderReadyRef.current = true;
        if (pendingImageRef.current) {
          const pendingImage = pendingImageRef.current;
          pendingImageRef.current = null;
          sendImageToDecoder(pendingImage);
        }
        return;
      }

      if (data.type !== 'scan-result') {
        return;
      }

      pendingImageRef.current = null;
      clearScanTimeout();
      setLoading(false);
      if (data.success) {
        parseUPIData(data.code, data.ocrText);
      } else {
        showAlert('Scan Failed', data.error || 'No QR code found. Please ensure the image is clear and contains a UPI QR code.');
      }
    } catch (e) {
      pendingImageRef.current = null;
      clearScanTimeout();
      setLoading(false);
    }
  };

  const parseUPIData = (url: string, ocrText?: string | null) => {
    if (!url) {
      showAlert('Invalid QR', 'This is not a valid UPI QR code.');
      return;
    }

    try {
      const extracted = extractQRData(url, ocrText);
      const params = new URLSearchParams(url.split('?')[1] || '');
      
      setForm(prev => ({
        ...prev,
        name: extracted.name || prev.name,
        bankName: extracted.bankName || prev.bankName,
        upiId: extracted.upiId || prev.upiId,
        qrValue: extracted.qrValue,
        notes: params.get('tn') || prev.notes,
      }));
      setShowForm(true);
    } catch (e) {
      showAlert('Error', 'Failed to parse payment details.');
    }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js"></script>
      </head>
      <body>
        <script>
          const postResult = (payload) => {
            window.ReactNativeWebView.postMessage(JSON.stringify(payload));
          };

          const recognizeText = async (imageDataUri) => {
            if (typeof Tesseract === 'undefined') {
              return '';
            }

            try {
              const timeout = new Promise((resolve) => setTimeout(() => resolve(''), 12000));
              const recognition = Tesseract.recognize(imageDataUri, 'eng')
                .then((result) => result && result.data ? result.data.text || '' : '')
                .catch(() => '');
              return await Promise.race([recognition, timeout]);
            } catch (error) {
              return '';
            }
          };

          window.scanQRCode = (imageDataUri) => {
            const img = new Image();
            img.onload = async () => {
              try {
                if (typeof jsQR === 'undefined') {
                  postResult({ type: 'scan-result', success: false, error: 'QR decoder is still loading. Please try again.' });
                  return;
                }

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: "attemptBoth",
                });
                const ocrText = await recognizeText(imageDataUri);
                
                postResult({ 
                  type: 'scan-result',
                  success: !!code, 
                  code: code ? code.data : null,
                  ocrText,
                });
              } catch (error) {
                postResult({ type: 'scan-result', success: false, error: 'Could not analyze this image.' });
              }
            };
            img.onerror = () => postResult({ type: 'scan-result', success: false, error: 'Could not load the selected image.' });
            img.src = imageDataUri;
          };

          const markReady = () => postResult({ type: 'ready' });
          if (typeof jsQR === 'undefined') {
            const readyCheck = setInterval(() => {
              if (typeof jsQR !== 'undefined') {
                clearInterval(readyCheck);
                markReady();
              }
            }, 100);
            setTimeout(() => {
              if (typeof jsQR === 'undefined') {
                clearInterval(readyCheck);
                markReady();
              }
            }, 3000);
          } else {
            markReady();
          }
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="Setup QR Code" titleStyle={{ fontWeight: '900' }} />
        <Appbar.Action icon="close" onPress={onBack} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {showForm ? (
          <Surface style={styles.formCard} elevation={1}>
            <Text variant="titleMedium" style={styles.formTitle}>
              {editId ? 'Edit UPI Entry' : 'New UPI Entry'}
            </Text>

            <TextInput
              label="Name"
              value={form.name}
              onChangeText={v => setForm(p => ({ ...p, name: v }))}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Bank Name"
              value={form.bankName}
              mode="outlined"
              style={styles.input}
              right={<TextInput.Icon icon="chevron-down" onPress={() => setBankPickerVisible(true)} />}
              showSoftInputOnFocus={false}
              onFocus={() => setBankPickerVisible(true)}
            />

            <TextInput
              label="UPI ID"
              value={form.upiId}
              onChangeText={v => setForm(p => ({ ...p, upiId: v }))}
              mode="outlined"
              style={styles.input}
              autoCapitalize="none"
            />
            <TextInput
              label="QR Value"
              value={form.qrValue}
              onChangeText={v => setForm(p => ({ ...p, qrValue: v }))}
              mode="outlined"
              style={styles.input}
              multiline
              autoCapitalize="none"
            />
            <TextInput
              label="Mobile Number"
              value={form.mobileNumber}
              onChangeText={v => setForm(p => ({ ...p, mobileNumber: v }))}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
            />

            <View style={styles.buttonRow}>
              <Button mode="outlined" onPress={handleCancel} style={styles.flexBtn}>
                Cancel
              </Button>
              <Button mode="contained" onPress={handleSave} style={styles.flexBtn}>
                {editId ? 'Update' : 'Save'}
              </Button>
            </View>
          </Surface>
        ) : (
          <View>
            <View style={styles.mainActions}>
              <Button 
                mode="contained" 
                icon="image-plus" 
                onPress={pickAndScan}
                style={styles.scanBtn}
                loading={loading}
                disabled={loading}
                labelStyle={styles.btnLabel}
              >
                Scan from Gallery
              </Button>
              <Button 
                mode="outlined" 
                icon="pencil" 
                onPress={() => setShowForm(true)}
                style={styles.manualBtn}
                disabled={loading}
              >
                Manual Entry
              </Button>
            </View>

            {loading && (
              <View style={styles.loadingBox}>
                <ActivityIndicator animating={true} color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.primary }]}>Analyzing Image...</Text>
              </View>
            )}

            {entries.length === 0 ? (
              <View style={styles.empty}>
                <Avatar.Icon size={64} icon="qrcode" style={{ backgroundColor: theme.colors.surfaceVariant }} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No UPI entries added yet.</Text>
              </View>
            ) : (
              entries.map(entry => (
                <Surface key={entry.id} style={styles.listItem} elevation={1}>
                  <List.Item
                    title={entry.name || entry.bankName || entry.upiId || 'QR Entry'}
                    description={entry.upiId || entry.qrValue}
                    left={props => {
                      const bank = findBankByName(entry.bankName);
                      if (bank) {
                        return <Avatar.Image {...props} source={bank.symbol} size={40} style={[props.style, { backgroundColor: 'transparent' }]} />;
                      }
                      return <List.Icon {...props} icon="qrcode" />;
                    }}
                    right={() => (
                      <View style={styles.itemActions}>
                        <IconButton icon="pencil" size={20} onPress={() => handleEdit(entry)} />
                        <IconButton icon="delete" size={20} iconColor={theme.colors.error} onPress={() => {
                          showAlert('Delete Entry', 'Are you sure you want to delete this UPI entry?', () => onDelete(entry.id));
                        }} />
                      </View>
                    )}
                  />
                </Surface>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Background Decoder */}
      <View pointerEvents="none" style={styles.decoderHost}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          onMessage={onWebViewMessage}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
        />
      </View>

      <BankPicker 
        visible={bankPickerVisible} 
        onDismiss={() => setBankPickerVisible(false)} 
        onSelect={(name) => setForm(p => ({ ...p, bankName: name }))} 
      />

      <Portal>
        <Dialog visible={dialogState.visible} onDismiss={() => setDialogState(s => ({ ...s, visible: false }))}>
          <Dialog.Title>{dialogState.title}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{dialogState.message}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            {dialogState.onConfirm && (
              <Button onPress={() => setDialogState(s => ({ ...s, visible: false }))}>Cancel</Button>
            )}
            <Button 
              textColor={dialogState.onConfirm ? theme.colors.error : theme.colors.primary} 
              onPress={() => {
                if (dialogState.onConfirm) dialogState.onConfirm();
                setDialogState(s => ({ ...s, visible: false }));
              }}
            >
              {dialogState.onConfirm ? 'Delete' : 'OK'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16 },
  sheetTitle: { fontSize: 24, fontWeight: '900' },
  scrollContent: { padding: 16 },
  mainActions: { gap: 12, marginBottom: 20 },
  scanBtn: { paddingVertical: 8, borderRadius: 12 },
  manualBtn: { paddingVertical: 4, borderRadius: 12 },
  btnLabel: { fontSize: 16, fontWeight: '700' },
  formCard: { padding: 20, borderRadius: 16, marginBottom: 20 },
  formTitle: { marginBottom: 16, fontWeight: '700' },
  input: { marginBottom: 12 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  flexBtn: { flex: 1 },
  listItem: { borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  itemActions: { flexDirection: 'row' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { marginTop: 12 },
  loadingBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  loadingText: { marginLeft: 10, fontWeight: '600' },
  decoderHost: { height: 1, width: 1, opacity: 0, position: 'absolute', left: -10, top: -10 },
});

export default SetupQR;
