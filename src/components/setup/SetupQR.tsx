import React, { useState, useRef } from 'react';
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
  ActivityIndicator
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { WebView } from 'react-native-webview';
import { QREntry } from '../../types';
import BankPicker from '../BankPicker';

interface SetupQRProps {
  entries: QREntry[];
  onAdd: (entry: Omit<QREntry, 'id'>) => void;
  onUpdate: (id: string, entry: Omit<QREntry, 'id'>) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const emptyForm = (): Omit<QREntry, 'id'> => ({
  bankName: '',
  upiId: '',
  mobileNumber: '',
  address: '',
  notes: '',
});

const SetupQR: React.FC<SetupQRProps> = ({ entries, onAdd, onUpdate, onDelete, onBack }) => {
  const [form, setForm] = useState<Omit<QREntry, 'id'>>(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [bankPickerVisible, setBankPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const theme = useTheme();

  const handleSave = () => {
    if (!form.bankName.trim() || !form.upiId.trim()) {
      Alert.alert('Required Fields', 'Please enter both Bank Name and UPI ID.');
      return;
    }
    if (editId) {
      onUpdate(editId, form);
    } else {
      onAdd(form);
    }
    handleCancel();
  };

  const handleEdit = (entry: QREntry) => {
    setForm({ ...entry });
    setEditId(entry.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setForm(emptyForm());
    setEditId(null);
    setShowForm(false);
    setLoading(false);
  };

  const pickAndScan = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
          webViewRef.current?.postMessage(dataUri);
        }
      }
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const onWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      setLoading(false);
      if (data.success) {
        parseUPIData(data.code);
      } else {
        Alert.alert('Scan Failed', 'No QR code found. Please ensure the image is clear and contains a UPI QR code.');
      }
    } catch (e) {
      setLoading(false);
    }
  };

  const parseUPIData = (url: string) => {
    if (!url.includes('upi://pay')) {
      Alert.alert('Invalid QR', 'This is not a valid UPI QR code.');
      return;
    }

    try {
      const queryString = url.split('?')[1];
      const params: any = {};
      queryString.split('&').forEach(p => {
        const [k, v] = p.split('=');
        if (k) params[k] = decodeURIComponent(v || '');
      });
      
      setForm(prev => ({
        ...prev,
        upiId: params.pa || prev.upiId,
        bankName: params.pn || prev.bankName,
        notes: params.tn || prev.notes,
      }));
      setShowForm(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to parse payment details.');
    }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
      </head>
      <body>
        <script>
          window.addEventListener('message', (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              
              if (typeof jsQR === 'undefined') {
                window.ReactNativeWebView.postMessage(JSON.stringify({ success: false, error: 'Lib not loaded' }));
                return;
              }

              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              });
              
              window.ReactNativeWebView.postMessage(JSON.stringify({ 
                success: !!code, 
                code: code ? code.data : null 
              }));
            };
            img.src = event.data;
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction color="white" onPress={onBack} />
        <Appbar.Content title="Setup UPI / QR" titleStyle={{ color: 'white' }} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {showForm ? (
          <Surface style={styles.formCard} elevation={1}>
            <Text variant="titleMedium" style={styles.formTitle}>
              {editId ? 'Edit UPI Entry' : 'New UPI Entry'}
            </Text>

            <TextInput
              label="Bank Name *"
              value={form.bankName}
              mode="outlined"
              style={styles.input}
              right={<TextInput.Icon icon="chevron-down" onPress={() => setBankPickerVisible(true)} />}
              showSoftInputOnFocus={false}
              onFocus={() => setBankPickerVisible(true)}
            />

            <TextInput
              label="UPI ID *"
              value={form.upiId}
              onChangeText={v => setForm(p => ({ ...p, upiId: v }))}
              mode="outlined"
              style={styles.input}
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
            <TextInput
              label="Bank Address"
              value={form.address}
              onChangeText={v => setForm(p => ({ ...p, address: v }))}
              mode="outlined"
              style={styles.input}
              multiline
            />
            <TextInput
              label="Notes"
              value={form.notes}
              onChangeText={v => setForm(p => ({ ...p, notes: v }))}
              mode="outlined"
              style={styles.input}
              multiline
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
                <Text style={styles.loadingText}>Analyzing Image...</Text>
              </View>
            )}

            {entries.length === 0 ? (
              <View style={styles.empty}>
                <Avatar.Icon size={64} icon="qrcode" style={{ backgroundColor: theme.colors.surfaceVariant }} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.emptyText}>No UPI entries added yet.</Text>
              </View>
            ) : (
              entries.map(entry => (
                <Surface key={entry.id} style={styles.listItem} elevation={1}>
                  <List.Item
                    title={entry.bankName}
                    description={entry.upiId}
                    left={props => <List.Icon {...props} icon="bank" />}
                    right={() => (
                      <View style={styles.itemActions}>
                        <IconButton icon="pencil" size={20} onPress={() => handleEdit(entry)} />
                        <IconButton icon="delete" size={20} iconColor={theme.colors.error} onPress={() => onDelete(entry.id)} />
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
      <View style={{ height: 0, width: 0, opacity: 0, position: 'absolute' }}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          onMessage={onWebViewMessage}
        />
      </View>

      <BankPicker 
        visible={bankPickerVisible} 
        onDismiss={() => setBankPickerVisible(false)} 
        onSelect={(name) => setForm(p => ({ ...p, bankName: name }))} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  emptyText: { marginTop: 12, color: '#79747E' },
  loadingBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  loadingText: { marginLeft: 10, fontWeight: '600', color: '#6750A4' },
});

export default SetupQR;
