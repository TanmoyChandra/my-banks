import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert,
} from 'react-native';
import { Text, useTheme, IconButton, TextInput as PaperInput, Button, Surface, Portal, Dialog } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MerchantQR } from '../../types';
import { useWalletStore } from '../../store/useWalletStore';

interface Props {
  onBack: () => void;
}

const EMPTY_FORM = { name: '', category: '', upiId: '', notes: '', imageUri: '' };

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

  const textColor = theme.colors.onSurface;
  const subColor = theme.colors.onSurfaceVariant;
  const surfaceBg = theme.colors.surface;
  const accentColor = '#C9F158';

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (m: MerchantQR) => {
    setEditingId(m.id);
    setForm({ name: m.name, category: m.category || '', upiId: m.upiId || '', notes: m.notes || '', imageUri: m.imageUri });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setForm(f => ({ ...f, imageUri: result.assets[0].uri }));
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      Alert.alert('Required', 'Please enter a merchant name.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || undefined,
      upiId: form.upiId.trim() || undefined,
      imageUri: form.imageUri,
      notes: form.notes.trim() || undefined,
    };
    if (editingId) {
      updateMerchantQR(editingId, payload);
    } else {
      addMerchantQR(payload);
    }
    resetForm();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} iconColor={textColor} onPress={showForm ? resetForm : onBack} style={{ margin: 0 }} />
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {showForm ? (editingId ? 'Edit Merchant QR' : 'Add Merchant QR') : 'Merchant QR Codes'}
        </Text>
        {!showForm ? (
          <IconButton icon="plus" size={24} iconColor={textColor} onPress={openAdd} style={{ margin: 0 }} />
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Add / Edit Form ── */}
        {showForm && (
          <Surface style={[styles.formCard, { backgroundColor: surfaceBg }]} elevation={0}>

            {/* Gallery picker (optional) */}
            <TouchableOpacity style={[styles.imagePicker, { borderColor: theme.colors.outline }]} onPress={pickImage} activeOpacity={0.8}>
              {form.imageUri ? (
                <View style={{ width: '100%', height: '100%' }}>
                  <Image source={{ uri: form.imageUri }} style={styles.pickedImage} resizeMode="contain" />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setForm(f => ({ ...f, imageUri: '' }))}
                  >
                    <IconButton icon="close-circle" size={22} iconColor="#fff" style={{ margin: 0 }} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Text style={{ fontSize: 32 }}>📷</Text>
                  <Text style={[styles.imagePickerText, { color: subColor }]}>Tap to pick QR from Gallery</Text>
                  <Text style={[styles.imagePickerSub, { color: subColor }]}>(optional)</Text>
                </View>
              )}
            </TouchableOpacity>

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
              label="UPI ID (optional)"
              value={form.upiId}
              onChangeText={v => setForm(f => ({ ...f, upiId: v }))}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <PaperInput
              mode="outlined"
              label="Notes (optional)"
              value={form.notes}
              onChangeText={v => setForm(f => ({ ...f, notes: v }))}
              style={styles.input}
              multiline
              numberOfLines={2}
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
          <>
            {merchants.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🏪</Text>
                <Text style={[styles.emptyTitle, { color: textColor, opacity: 0.4 }]}>No merchant QRs yet</Text>
                <Text style={[styles.emptySubText, { color: subColor }]}>Tap + to add your first one</Text>
              </View>
            ) : (
              merchants.map(m => (
                <Surface key={m.id} style={[styles.merchantItem, { backgroundColor: surfaceBg }]} elevation={0}>
                  {m.imageUri ? (
                    <Image source={{ uri: m.imageUri }} style={styles.thumbImage} resizeMode="contain" />
                  ) : (
                    <View style={[styles.thumbPlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Text style={{ fontSize: 22 }}>🏪</Text>
                    </View>
                  )}
                  <View style={styles.merchantMeta}>
                    <Text style={[styles.merchantName, { color: textColor }]}>{m.name}</Text>
                    {m.category ? <Text style={[styles.merchantCat, { color: subColor }]}>{m.category}</Text> : null}
                    {m.upiId ? <Text style={[styles.merchantUpi, { color: subColor }]}>{m.upiId}</Text> : null}
                  </View>
                  <IconButton
                    icon="pencil-outline"
                    size={20}
                    iconColor={subColor}
                    onPress={() => openEdit(m)}
                    style={{ margin: 0 }}
                  />
                  <IconButton
                    icon="delete-outline"
                    size={20}
                    iconColor={theme.colors.error}
                    onPress={() => setDeleteId(m.id)}
                    style={{ margin: 0 }}
                  />
                </Surface>
              ))
            )}
          </>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', fontFamily: 'SpaceGrotesk', textAlign: 'center' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },

  formCard: { borderRadius: 20, padding: 20, marginBottom: 16 },
  imagePicker: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  imagePickerPlaceholder: { alignItems: 'center' },
  imagePickerText: { fontSize: 13, fontFamily: 'SpaceGrotesk', marginTop: 6 },
  imagePickerSub: { fontSize: 11, fontFamily: 'SpaceGrotesk', marginTop: 2, opacity: 0.6 },
  pickedImage: { width: '100%', height: '100%' },
  removeImageBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
  },
  input: { marginBottom: 12 },
  saveBtn: { borderRadius: 14, marginTop: 4 },

  merchantItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 12, marginBottom: 10 },
  thumbImage: { width: 48, height: 48, borderRadius: 10, marginRight: 12 },
  thumbPlaceholder: { width: 48, height: 48, borderRadius: 10, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  merchantMeta: { flex: 1 },
  merchantName: { fontSize: 15, fontWeight: '700', fontFamily: 'SpaceGrotesk' },
  merchantCat: { fontSize: 12, fontFamily: 'SpaceGrotesk', marginTop: 2 },
  merchantUpi: { fontSize: 11, fontFamily: 'SpaceGrotesk', marginTop: 1, opacity: 0.7 },

  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'SpaceGrotesk' },
  emptySubText: { fontSize: 14, fontFamily: 'SpaceGrotesk', marginTop: 8 },
});
