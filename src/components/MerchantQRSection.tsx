import React, { useState, useRef } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  Image, Modal, Dimensions, Linking, Alert, Animated,
} from 'react-native';
import { Text, useTheme, Avatar, IconButton, Chip } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { MerchantQR } from '../types';
import { useUiStore } from '../store/useUiStore';
import { useWalletStore } from '../store/useWalletStore';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Full-screen QR for payment ────────────────────────────────
function QRPayViewer({
  uri,
  merchantName,
  upiId,
  onClose,
}: {
  uri: string;
  merchantName: string;
  upiId?: string;
  onClose: () => void;
}) {
  const theme = useTheme();

  const handlePayUPI = async () => {
    if (!upiId) return;
    const url = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&cu=INR`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('No UPI App Found', 'Please install a UPI payment app (GPay, PhonePe, Paytm, etc.)');
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={fsStyles.backdrop}>
        {/* Ambient blurred glow behind the QR image */}
        <Image
          source={{ uri }}
          style={fsStyles.ambientBlur}
          resizeMode="cover"
          blurRadius={28}
        />
        <View style={fsStyles.ambientOverlay} />

        {/* Header */}
        <View style={fsStyles.header}>
          <TouchableOpacity onPress={onClose} style={fsStyles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <IconButton icon="close" size={22} iconColor="#fff" style={{ margin: 0 }} />
          </TouchableOpacity>
          <View style={fsStyles.headerText}>
            <Text style={fsStyles.headerTitle}>{merchantName}</Text>
            {upiId ? <Text style={fsStyles.headerSub}>{upiId}</Text> : null}
          </View>
        </View>

        {/* QR image — large, fills most of the screen */}
        <View style={fsStyles.qrContainer}>
          <Image source={{ uri }} style={fsStyles.qrImage} resizeMode="contain" />
        </View>

        <Text style={fsStyles.hint}>
          Open your payment app scanner and point it at this QR code
        </Text>

        {upiId ? (
          <TouchableOpacity onPress={handlePayUPI} style={fsStyles.upiButton} activeOpacity={0.85}>
            <IconButton icon="send" size={16} iconColor="#000" style={{ margin: 0 }} />
            <Text style={fsStyles.upiButtonText}>Pay via UPI ID instead</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Modal>
  );
}

const fsStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    paddingBottom: 40,
  },
  ambientBlur: {
    position: 'absolute',
    width: SCREEN_W,
    height: SCREEN_H,
    opacity: 0.35,
  },
  ambientOverlay: {
    position: 'absolute',
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
    gap: 8,
    zIndex: 1,
  },
  closeBtn: { padding: 4 },
  headerText: { flex: 1 },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk',
    marginTop: 2,
  },
  qrContainer: {
    width: SCREEN_W - 32,
    aspectRatio: 1,
    maxHeight: SCREEN_H * 0.62,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 1,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  hint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk',
    textAlign: 'center',
    marginTop: 16,
    marginHorizontal: 32,
    lineHeight: 18,
    zIndex: 1,
  },
  upiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C9F158',
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 22,
    marginTop: 16,
    gap: 4,
    zIndex: 1,
  },
  upiButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'SpaceGrotesk',
  },
});

// ── UPI pay helper ────────────────────────────────────────────
async function openUPIPayment(upiId: string, name: string) {
  const url = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&cu=INR`;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    Alert.alert('No UPI App Found', 'Please install a UPI payment app (GPay, PhonePe, Paytm, etc.) to make payments.');
  }
}

// ── MerchantCard ──────────────────────────────────────────────
function MerchantCard({ merchant }: { merchant: MerchantQR }) {
  const [expanded, setExpanded] = useState(false);
  const [showQRViewer, setShowQRViewer] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;
  const theme = useTheme();
  const isDark = theme.dark;

  const cardBg = theme.colors.surface;
  const textColor = theme.colors.onSurface;
  const subColor = theme.colors.onSurfaceVariant;
  const borderColor = isDark ? theme.colors.outlineVariant : theme.colors.outline;
  const accentColor = '#C9F158';
  // In light mode buttons always use dark ink; in dark mode use accent
  const qrActiveColor = isDark ? accentColor : '#1a1a1a';

  const toggle = () => {
    Animated.timing(animValue, {
      toValue: expanded ? 0 : 1,
      duration: 260,
      useNativeDriver: false,
    }).start();
    setExpanded(v => !v);
  };

  const expandHeight = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 56], // height of the button row
  });
  const expandOpacity = animValue;

  const handlePayUPI = () => {
    if (merchant.upiId) {
      openUPIPayment(merchant.upiId, merchant.name);
    } else {
      Alert.alert('No UPI ID', 'This merchant does not have a UPI ID saved. Edit from Settings → Merchant QRs.');
    }
  };

  const handlePayQR = () => {
    if (merchant.imageUri) {
      setShowQRViewer(true);
    } else {
      Alert.alert('No QR Image', 'This merchant does not have a QR code image saved.');
    }
  };

  const copyUpi = async () => {
    if (merchant.upiId) await Clipboard.setStringAsync(merchant.upiId);
  };

  const hasUPI = !!merchant.upiId;
  const hasQR = !!merchant.imageUri;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={toggle}
        style={[styles.card, { backgroundColor: cardBg, borderColor }]}
      >
        {/* ── Header row: thumb + name + category chip + chevron ── */}
        <View style={styles.cardHeader}>
          {/* QR thumbnail or placeholder */}
          <View style={[styles.thumbBox, { backgroundColor: isDark ? '#2A2A2A' : '#F2F3F5', borderColor }]}>
            {hasQR ? (
              <Image source={{ uri: merchant.imageUri }} style={styles.thumbImage} resizeMode="cover" />
            ) : (
              <Avatar.Icon
                size={40}
                icon="qrcode"
                style={{ backgroundColor: 'transparent' }}
                color={subColor}
              />
            )}
          </View>

          <View style={styles.nameMeta}>
            {/* Name + category chip inline */}
            <View style={styles.nameRow}>
              <Text style={[styles.merchantName, { color: textColor }]} numberOfLines={1}>
                {merchant.name}
              </Text>
              {merchant.category ? (
                <View style={[styles.catChip, { backgroundColor: isDark ? '#2A2A2A' : '#EAEAEA' }]}>
                  <Text style={[styles.catChipText, { color: subColor }]}>{merchant.category}</Text>
                </View>
              ) : null}
            </View>

            {/* UPI ID — tap to copy */}
            {hasUPI ? (
              <TouchableOpacity
                onPress={e => { e.stopPropagation?.(); copyUpi(); }}
                activeOpacity={0.7}
                style={styles.upiRow}
              >
                <Text style={[styles.upiText, { color: subColor }]} numberOfLines={1}>
                  {merchant.upiId}
                </Text>
                <IconButton icon="content-copy" size={11} iconColor={subColor} style={styles.copyIcon} />
              </TouchableOpacity>
            ) : null}

            {/* Notes */}
            {merchant.notes ? (
              <Text style={[styles.notesText, { color: subColor }]} numberOfLines={1}>
                {merchant.notes}
              </Text>
            ) : null}
          </View>

          {/* Chevron */}
          <Animated.View style={{
            transform: [{ rotate: animValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }],
          }}>
            <IconButton icon="chevron-down" size={18} iconColor={subColor} style={{ margin: 0 }} />
          </Animated.View>
        </View>

        {/* ── Expandable pay buttons ── */}
        <Animated.View style={[styles.expandWrap, { height: expandHeight, opacity: expandOpacity, borderTopColor: borderColor }]}>
          <View style={styles.payActions}>
            {/* Scan QR — LEFT */}
            <TouchableOpacity
              onPress={e => { e.stopPropagation?.(); handlePayQR(); }}
              style={[
                styles.payBtn,
                styles.payBtnOutline,
                { borderColor: hasQR ? qrActiveColor : borderColor },
              ]}
              activeOpacity={0.8}
            >
              <IconButton icon="qrcode-scan" size={13} iconColor={hasQR ? qrActiveColor : subColor} style={{ margin: 0 }} />
              <Text style={[styles.payBtnText, { color: hasQR ? qrActiveColor : subColor }]}>Scan QR</Text>
            </TouchableOpacity>

            {/* Pay UPI — RIGHT */}
            <TouchableOpacity
              onPress={e => { e.stopPropagation?.(); handlePayUPI(); }}
              style={[
                styles.payBtn,
                hasUPI
                  ? { backgroundColor: accentColor }
                  : { backgroundColor: isDark ? '#2A2A2A' : theme.colors.surfaceVariant },
              ]}
              activeOpacity={0.8}
            >
              <IconButton icon="send" size={13} iconColor={hasUPI ? '#1a1a1a' : subColor} style={{ margin: 0 }} />
              <Text style={[styles.payBtnText, { color: hasUPI ? '#1a1a1a' : subColor }]}>Pay UPI</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Full-screen QR viewer */}
      {showQRViewer && hasQR ? (
        <QRPayViewer
          uri={merchant.imageUri}
          merchantName={merchant.name}
          upiId={merchant.upiId}
          onClose={() => setShowQRViewer(false)}
        />
      ) : null}
    </>
  );
}

// ── Main Section ──────────────────────────────────────────────
export default function MerchantQRSection() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const userName = useUiStore(s => s.userName);
  const initials = userName ? userName.charAt(0).toUpperCase() : '?';
  const merchants = useWalletStore(s => s.merchantQRs);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {/* Header — same pattern as other sections */}
      <View style={styles.sectionIntro}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={[styles.introTitle, { color: theme.colors.onSurface }]}>Merchant QRs</Text>
            <Text style={[styles.introText, { color: theme.dark ? '#a1a1aa' : '#52525b' }]}>
              Tap a merchant to pay instantly via UPI or QR.
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
              size={64}
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
          merchants.map(m => <MerchantCard key={m.id} merchant={m} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionIntro: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 },
  introTitle: { fontSize: 28, fontWeight: '700', marginBottom: 6, fontFamily: 'SpaceGrotesk', letterSpacing: -0.5 },
  introText: { fontSize: 14, fontFamily: 'SpaceGrotesk', lineHeight: 20 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 96 },

  // ── Card ──────────────────────────────────────────────────────
  card: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  thumbBox: {
    width: 46,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  thumbImage: { width: 46, height: 46 },
  nameMeta: { flex: 1, gap: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },
  merchantName: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk',
    flexShrink: 1,
  },
  catChip: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexShrink: 0,
  },
  catChipText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk',
  },
  upiRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upiText: {
    fontSize: 11,
    fontFamily: 'SpaceGrotesk',
    flex: 1,
  },
  copyIcon: { margin: 0, marginLeft: -2 },
  notesText: {
    fontSize: 11,
    fontFamily: 'SpaceGrotesk',
    opacity: 0.7,
  },

  // ── Expand / pay buttons ──────────────────────────────────────
  expandWrap: {
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  payActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  payBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 0,
  },
  payBtnOutline: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  payBtnText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk',
  },

  // ── Empty state ───────────────────────────────────────────────
  emptyContainer: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'SpaceGrotesk', opacity: 0.4 },
  emptySubText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
