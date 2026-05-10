import React, { useState, useRef } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  Image, Animated, Modal, Dimensions,
} from 'react-native';
import { Text, useTheme, Avatar, IconButton, Portal, Dialog, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { MerchantQR } from '../types';
import { useUiStore } from '../store/useUiStore';
import { useWalletStore } from '../store/useWalletStore';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Full-screen image viewer ──────────────────────────────────
function FullScreenImage({ uri, onClose }: { uri: string; onClose: () => void }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={fsStyles.backdrop}>
        <TouchableOpacity style={fsStyles.closeBtn} onPress={onClose}>
          <IconButton icon="close" size={26} iconColor="#fff" style={{ margin: 0 }} />
        </TouchableOpacity>
        <Image source={{ uri }} style={fsStyles.fullImage} resizeMode="contain" />
      </View>
    </Modal>
  );
}

const fsStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 48,
    right: 16,
    zIndex: 10,
  },
  fullImage: {
    width: SCREEN_W - 32,
    height: SCREEN_H * 0.7,
  },
});

// ── MerchantRow ───────────────────────────────────────────────
function MerchantRow({
  merchant,
  onDelete,
}: {
  merchant: MerchantQR;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;
  const theme = useTheme();

  const isDark = theme.dark;
  const textColor = theme.colors.onSurface;
  const subColor = theme.colors.onSurfaceVariant;
  const surfaceBg = theme.colors.surface;
  const accentColor = '#C9F158';

  const toggle = () => {
    Animated.timing(animValue, {
      toValue: expanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  const copyUpi = () => {
    if (merchant.upiId) Clipboard.setStringAsync(merchant.upiId);
  };

  // Dynamic height: more space if there's an image
  const maxExpandHeight = merchant.imageUri ? 380 : 130;
  const expandedHeight = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxExpandHeight],
  });
  const expandedOpacity = animValue;

  return (
    <View style={[styles.rowCard, { backgroundColor: surfaceBg }]}>
      {/* Header tap row */}
      <TouchableOpacity activeOpacity={0.8} onPress={toggle} style={styles.rowHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: isDark ? '#2A2A2A' : '#F2F3F5' }]}>
          <Avatar.Icon
            size={36}
            icon="qrcode"
            style={{ backgroundColor: 'transparent' }}
            color={subColor}
          />
        </View>
        <View style={styles.rowMeta}>
          <Text style={[styles.merchantName, { color: textColor }]}>{merchant.name}</Text>
          {merchant.category ? (
            <Text style={[styles.merchantCategory, { color: subColor }]}>{merchant.category}</Text>
          ) : null}
        </View>
        <View style={styles.rowActions}>
          <Animated.View style={{
            transform: [{ rotate: animValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }]
          }}>
            <IconButton icon="chevron-down" size={20} iconColor={subColor} style={{ margin: 0 }} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Expanded: QR image + details */}
      <Animated.View style={{ height: expandedHeight, opacity: expandedOpacity, overflow: 'hidden' }}>
        <View style={styles.expandedContent}>
          <View style={[styles.divider, { backgroundColor: theme.colors.surfaceVariant }]} />

          {/* QR Image — tappable for full screen */}
          {merchant.imageUri ? (
            <TouchableOpacity activeOpacity={0.85} onPress={() => setFullScreen(true)} style={styles.qrImageWrapper}>
              <Image source={{ uri: merchant.imageUri }} style={styles.qrImage} resizeMode="contain" />
              <Text style={[styles.tapHint, { color: subColor }]}>Tap to view full screen</Text>
            </TouchableOpacity>
          ) : null}

          {/* UPI ID — tappable to copy */}
          {merchant.upiId ? (
            <TouchableOpacity onPress={copyUpi} activeOpacity={0.7} style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: subColor }]}>UPI ID  •  tap to copy</Text>
              <Text style={[styles.detailValue, { color: textColor }]}>{merchant.upiId}</Text>
            </TouchableOpacity>
          ) : null}

          {/* Notes */}
          {merchant.notes ? (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: subColor }]}>Notes</Text>
              <Text style={[styles.detailValue, { color: textColor }]}>{merchant.notes}</Text>
            </View>
          ) : null}
        </View>
      </Animated.View>

      {/* Full-screen viewer */}
      {fullScreen && merchant.imageUri ? (
        <FullScreenImage uri={merchant.imageUri} onClose={() => setFullScreen(false)} />
      ) : null}
    </View>
  );
}

// ── Main Section ──────────────────────────────────────────────
export default function MerchantQRSection() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const userName = useUiStore(s => s.userName);
  const initials = userName ? userName.charAt(0).toUpperCase() : '?';
  const merchants = useWalletStore(s => s.merchantQRs);
  const deleteMerchantQR = useWalletStore(s => s.deleteMerchantQR);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {/* Header */}
      <View style={styles.sectionIntro}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={[styles.introTitle, { color: theme.colors.onSurface }]}>Merchant QRs</Text>
            <Text style={[styles.introText, { color: theme.dark ? '#a1a1aa' : '#52525b' }]}>
              Frequently used payment QR codes, always at hand.
            </Text>
          </View>
          <Avatar.Text
            size={40}
            label={initials}
            style={{ backgroundColor: theme.colors.primaryContainer }}
            labelStyle={{ color: theme.colors.onPrimaryContainer, fontWeight: '700' }}
          />
        </View>
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {merchants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Avatar.Icon
              size={72}
              icon="store-outline"
              style={{ backgroundColor: theme.colors.surfaceVariant, marginBottom: 16 }}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>No merchant QR codes</Text>
            <Text style={[styles.emptySubText, { color: theme.colors.onSurfaceVariant }]}>
              Add them from Settings → Merchant QR Codes
            </Text>
          </View>
        ) : (
          merchants.map(m => (
            <MerchantRow
              key={m.id}
              merchant={m}
              onDelete={() => setDeleteId(m.id)}
            />
          ))
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
  sectionIntro: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 },
  introTitle: { fontSize: 28, fontWeight: '700', marginBottom: 6, fontFamily: 'SpaceGrotesk', letterSpacing: -0.5 },
  introText: { fontSize: 14, fontFamily: 'SpaceGrotesk', lineHeight: 20 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 96 },

  rowCard: { borderRadius: 20, marginBottom: 12, overflow: 'hidden' },
  rowHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  categoryBadge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  categoryEmoji: { fontSize: 22 },
  rowMeta: { flex: 1 },
  merchantName: { fontSize: 16, fontWeight: '700', fontFamily: 'SpaceGrotesk' },
  merchantCategory: { fontSize: 13, fontFamily: 'SpaceGrotesk', marginTop: 2 },
  rowActions: { flexDirection: 'row', alignItems: 'center' },
  expandedContent: { paddingHorizontal: 16, paddingBottom: 16 },
  divider: { height: 1, marginBottom: 16 },
  qrImageWrapper: { alignItems: 'center', marginBottom: 12 },
  qrImage: { width: 200, height: 200, borderRadius: 12 },
  tapHint: { fontSize: 11, fontFamily: 'SpaceGrotesk', marginTop: 6 },
  detailRow: { marginBottom: 10 },
  detailLabel: { fontSize: 11, fontWeight: '600', fontFamily: 'SpaceGrotesk', letterSpacing: 0.4, marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '600', fontFamily: 'SpaceGrotesk' },
  emptyContainer: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'SpaceGrotesk', opacity: 0.4 },
  emptySubText: { fontSize: 14, fontFamily: 'SpaceGrotesk', marginTop: 8, textAlign: 'center' },
});
