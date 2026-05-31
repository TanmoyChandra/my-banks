import React, { useState, useRef, useEffect } from 'react';
import { Swipeable } from 'react-native-gesture-handler';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert,
} from 'react-native';
import { Text, useTheme, IconButton, TextInput as PaperInput, Button, Surface, Portal, Dialog, List, Avatar, Appbar, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { WebView } from 'react-native-webview';
import { MerchantQR } from '../../types';
import { useWalletStore } from '../../store/useWalletStore';
import { extractQRData } from '../../utils/qrExtraction';

interface Props {
  onBack: () => void;
}

const EMPTY_FORM = { name: '', category: '', upiId: '', qrValue: '' };
const SCAN_TIMEOUT_MS = 30000;

function MerchantRow({ 
  m, 
  onEdit, 
  onDelete 
}: { 
  m: MerchantQR; 
  onEdit: () => void; 
  onDelete: () => void; 
}) {
  const theme = useTheme();
  const isDark = theme.dark;
  const swipeableRef = useRef<any>(null);

  const handleEditTap = () => {
    swipeableRef.current?.close();
    onEdit();
  };

  const renderLeftActions = () => (
    <TouchableOpacity 
      style={{ width: 80, backgroundColor: isDark ? '#1C3118' : '#E8F5E9', justifyContent: 'center', alignItems: 'center' }}
      onPress={handleEditTap}
      activeOpacity={0.8}
    >
      <IconButton icon="pencil" iconColor={isDark ? '#A1D99B' : '#4F7922'} />
    </TouchableOpacity>
  );

  const renderRightActions = () => (
    <TouchableOpacity 
      style={{ width: 80, backgroundColor: theme.colors.errorContainer, justifyContent: 'center', alignItems: 'center' }}
      onPress={onDelete}
      activeOpacity={0.8}
    >
      <IconButton icon="delete" iconColor={theme.colors.onErrorContainer} />
    </TouchableOpacity>
  );

  return (
    <Surface style={styles.listItem} elevation={1}>
      <Swipeable
        ref={swipeableRef}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        overshootLeft={false}
        overshootRight={false}
      >
        <List.Item
          title={m.name}
          titleStyle={{ fontWeight: '700' }}
          description={m.category || m.upiId || 'No details'}
          left={props => (
            <Avatar.Icon 
              {...props} 
              icon="storefront-outline" 
              size={40} 
              style={[props.style, { backgroundColor: theme.colors.surfaceVariant }]} 
            />
          )}
          style={{ backgroundColor: theme.colors.surface }}
        />
      </Swipeable>
    </Surface>
  );
}

export default function SetupMerchantQR({ onBack }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const merchants = useWalletStore(s => s.merchantQRs);
  const addMerchantQR = useWalletStore(s => s.addMerchantQR);
  const updateMerchantQR = useWalletStore(s => s.updateMerchantQR);
  const deleteMerchantQR = useWalletStore(s => s.deleteMerchantQR);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const webViewRef = useRef<WebView>(null);
  const pendingImageRef = useRef<string | null>(null);
  const decoderReadyRef = useRef(false);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const textColor = theme.colors.onSurface;
  const subColor = theme.colors.onSurfaceVariant;
  const surfaceBg = theme.colors.surface;
  const accentColor = '#AAEF00';

  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (m: MerchantQR) => {
    setEditingId(m.id);
    setForm({ name: m.name, category: m.category || '', upiId: m.upiId || '', qrValue: m.qrValue || '' });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    pendingImageRef.current = null;
    clearScanTimeout();
    setLoading(false);
  };

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
      Alert.alert('Scan Timed Out', 'The QR decoder did not respond. Please try a clearer image.');
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

  const pickAndScan = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        setLoading(true);
        
        const manipulated = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 600 } }],
          { format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        if (manipulated.base64) {
          const dataUri = `data:image/jpeg;base64,${manipulated.base64}`;
          sendImageToDecoder(dataUri);
        } else {
          setLoading(false);
          Alert.alert('Scan Failed', 'Could not read the selected image.');
        }
      }
    } catch (e) {
      pendingImageRef.current = null;
      clearScanTimeout();
      setLoading(false);
      Alert.alert('Error', 'Failed to pick image.');
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
        Alert.alert('Scan Failed', data.error || 'No QR code found. Please ensure the image is clear and contains a UPI QR code.');
      }
    } catch (e) {
      pendingImageRef.current = null;
      clearScanTimeout();
      setLoading(false);
    }
  };

  const parseUPIData = (url: string, ocrText?: string | null) => {
    if (!url) {
      Alert.alert('Invalid QR', 'This is not a valid UPI QR code.');
      return;
    }

    try {
      const extracted = extractQRData(url, ocrText);
      
      setForm(prev => ({
        ...prev,
        name: extracted.name || prev.name,
        upiId: extracted.upiId || prev.upiId,
        qrValue: extracted.qrValue,
      }));
      setEditingId(null);
      setShowForm(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to parse payment details.');
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      Alert.alert('Required', 'Please enter a merchant name.');
      return;
    }
    if (!form.upiId.trim()) {
      Alert.alert('Required', 'Please enter a UPI ID. This is mandatory for merchants.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || undefined,
      upiId: form.upiId.trim(),
      qrValue: form.qrValue.trim() || undefined,
    };
    if (editingId) {
      updateMerchantQR(editingId, payload);
    } else {
      addMerchantQR(payload);
    }
    resetForm();
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
      {/* Header */}
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content
          title={showForm ? (editingId ? 'Edit Merchant QR' : 'Add Merchant QR') : 'Merchant QR Codes'}
          titleStyle={{ fontWeight: '900' }}
        />
        <Appbar.Action icon="close" onPress={showForm ? resetForm : onBack} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Add / Edit Form ── */}
        {showForm && (
          <Surface style={[styles.formCard, { backgroundColor: surfaceBg }]} elevation={0}>
            <PaperInput
              mode="outlined"
              label="Merchant Name *"
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
              style={styles.input}
            />
            <PaperInput
              mode="outlined"
              label="Category (e.g. Food, Fuel)"
              value={form.category}
              onChangeText={v => setForm(f => ({ ...f, category: v }))}
              style={styles.input}
            />
            <PaperInput
              mode="outlined"
              label="UPI ID *"
              value={form.upiId}
              onChangeText={v => setForm(f => ({ ...f, upiId: v }))}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <PaperInput
              mode="outlined"
              label="QR Value (optional)"
              value={form.qrValue}
              onChangeText={v => setForm(f => ({ ...f, qrValue: v }))}
              style={styles.input}
              multiline
              autoCapitalize="none"
            />

            <Button
              mode="contained"
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: accentColor }]}
              labelStyle={{ color: '#202020', fontFamily: 'SpaceGrotesk', fontWeight: '700' }}
            >
              {editingId ? 'Update' : 'Save Merchant QR'}
            </Button>
          </Surface>
        )}

        {/* ── Existing list ── */}
        {!showForm && (
          <View>
            {loading && (
              <View style={styles.loadingBox}>
                <ActivityIndicator animating={true} color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.primary }]}>Analyzing Image...</Text>
              </View>
            )}

            {merchants.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Avatar.Icon
                  size={72}
                  icon="store-outline"
                  style={{ backgroundColor: theme.colors.surfaceVariant, marginBottom: 12 }}
                  color={subColor}
                />
                <Text style={[styles.emptyTitle, { color: textColor, opacity: 0.4 }]}>No merchant QRs yet</Text>
                <Text style={[styles.emptySubText, { color: subColor }]}>Add your first one below</Text>
              </View>
            ) : (
              merchants.map(m => (
                <MerchantRow
                  key={m.id}
                  m={m}
                  onEdit={() => openEdit(m)}
                  onDelete={() => setDeleteId(m.id)}
                />
              ))
            )}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: merchants.length === 0 ? 20 : 0, marginBottom: 20 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={pickAndScan}
                disabled={loading}
                style={{
                  flex: 1,
                  backgroundColor: theme.dark ? '#2A2A2A' : '#FFFFFF',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 80,
                  opacity: loading ? 0.5 : 1
                }}
              >
                <Avatar.Icon size={36} icon="image-plus" style={{ backgroundColor: 'transparent' }} color={theme.colors.onSurfaceVariant} />
                <Text style={{ marginTop: 4, color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk', fontWeight: '600', textAlign: 'center' }}>Scan from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={openAdd}
                disabled={loading}
                style={{
                  flex: 1,
                  backgroundColor: theme.dark ? '#2A2A2A' : '#FFFFFF',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 80,
                  opacity: loading ? 0.5 : 1
                }}
              >
                <Avatar.Icon size={36} icon="pencil" style={{ backgroundColor: 'transparent' }} color={theme.colors.onSurfaceVariant} />
                <Text style={{ marginTop: 4, color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk', fontWeight: '600', textAlign: 'center' }}>Manual Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Delete confirmation */}
      <Portal>
        <Dialog visible={!!deleteId} onDismiss={() => setDeleteId(null)} style={{ backgroundColor: theme.colors.surface }}>
          <Dialog.Title style={{ color: theme.colors.onSurface }}>Remove Merchant QR?</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>This will permanently remove this merchant QR code.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteId(null)}>Cancel</Button>
            <Button textColor={theme.colors.error} onPress={() => {
              if (deleteId) deleteMerchantQR(deleteId);
              setDeleteId(null);
            }}>Remove</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },

  formCard: { borderRadius: 20, padding: 20, marginBottom: 16 },
  input: { marginBottom: 12 },
  saveBtn: { borderRadius: 14, marginTop: 4 },

  listItem: { borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  itemActions: { flexDirection: 'row', marginRight: -8, gap: -4 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'SpaceGrotesk' },
  emptySubText: { fontSize: 14, marginTop: 8, fontFamily: 'SpaceGrotesk' },

  loadingBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  loadingText: { marginLeft: 10, fontWeight: '600', fontFamily: 'SpaceGrotesk' },
  decoderHost: { height: 1, width: 1, opacity: 0, position: 'absolute', left: -10, top: -10 },
});
