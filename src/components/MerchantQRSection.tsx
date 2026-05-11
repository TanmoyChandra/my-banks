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

// Pastel chip colours — cycles based on category string
const CHIP_PALETTES = [
  { bg: '#E8F5E9', text: '#2E7D32' }, // green
  { bg: '#FFF3E0', text: '#E65100' }, // orange
  { bg: '#E3F2FD', text: '#1565C0' }, // blue
  { bg: '#FCE4EC', text: '#AD1457' }, // pink
  { bg: '#F3E5F5', text: '#6A1B9A' }, // purple
  { bg: '#E0F7FA', text: '#00695C' }, // teal
  { bg: '#FFFDE7', text: '#F57F17' }, // amber
];
const CHIP_PALETTES_DARK = [
  { bg: '#1B5E20', text: '#A5D6A7' },
  { bg: '#E65100', text: '#FFE0B2' },
  { bg: '#0D47A1', text: '#90CAF9' },
  { bg: '#880E4F', text: '#F48FB1' },
  { bg: '#4A148C', text: '#CE93D8' },
  { bg: '#004D40', text: '#80CBC4' },
  { bg: '#F57F17', text: '#FFF9C4' },
];
function chipPalette(cat: string, isDark: boolean) {
  let h = 0;
  for (let i = 0; i < cat.length; i++) h = (h * 31 + cat.charCodeAt(i)) % 7;
  return isDark ? CHIP_PALETTES_DARK[h] : CHIP_PALETTES[h];
}

// ── MerchantCard ──────────────────────────────────────────────
function MerchantCard({ merchant }: { merchant: MerchantQR }) {
  const [expanded, setExpanded] = useState(false);
  const [showQRViewer, setShowQRViewer] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;
  const theme = useTheme();
  const isDark = theme.dark;

  const cardBg   = theme.colors.surface;
  const textColor = theme.colors.onSurface;
  const subColor  = theme.colors.onSurfaceVariant;
  const borderColor = isDark ? theme.colors.outlineVariant : theme.colors.outline;
  const accentColor = '#C9F158';
  const qrActiveColor = isDark ? accentColor : '#1a1a1a';

  const toggle = () => {
    Animated.timing(animValue, {
      toValue: expanded ? 0 : 1,
      duration: 240,
      useNativeDriver: false,
    }).start();
    setExpanded(v => !v);
  };

  const expandHeight = animValue.interpolate({ inputRange: [0, 1], outputRange: [0, 68] });
  const expandOpacity = animValue;

  const handlePayUPI = () => {
    if (merchant.upiId) openUPIPayment(merchant.upiId, merchant.name);
    else Alert.alert('No UPI ID', 'Edit from Settings → Merchant QRs.');
  };
  const handlePayQR = () => {
    if (merchant.imageUri) setShowQRViewer(true);
    else Alert.alert('No QR Image', 'This merchant does not have a QR code image saved.');
  };
  const copyUpi = async () => {
    if (merchant.upiId) await Clipboard.setStringAsync(merchant.upiId);
  };

  const hasUPI = !!merchant.upiId;
  const hasQR  = !!merchant.imageUri;
  const chip   = merchant.category ? chipPalette(merchant.category, isDark) : null;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={toggle}
        style={[styles.card, { backgroundColor: cardBg, borderColor }]}
      >
        {/* ── Main body row ── */}
        <View style={styles.cardBody}>

          {/* Left: QR icon box */}
          <View style={[styles.iconBox, { backgroundColor: isDark ? '#2A2A2A' : '#F4F4F5', borderColor }]}>
            {hasQR ? (
              <Avatar.Icon
                size={44}
                icon="qrcode"
                style={{ backgroundColor: 'transparent' }}
                color={isDark ? '#A1A1AA' : '#52525B'}
              />
            ) : (
              <Avatar.Icon
                size={44}
                icon="account-circle-outline"
                style={{ backgroundColor: 'transparent' }}
                color={isDark ? '#52525B' : '#A1A1AA'}
              />
            )}
          </View>

          {/* Centre: name + chip + upi + notes */}
          <View style={styles.nameMeta}>
            {/* Name + category chip */}
            <View style={styles.nameRow}>
              <Text style={[styles.merchantName, { color: textColor }]} numberOfLines={1}>
                {merchant.name}
              </Text>
              {merchant.category && chip ? (
                <View style={[styles.catChip, { backgroundColor: chip.bg }]}>
                  <Text style={[styles.catChipText, { color: chip.text }]}>
                    {merchant.category.toUpperCase()}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* UPI ID */}
            {hasUPI ? (
              <Text style={[styles.upiText, { color: subColor }]} numberOfLines={1}>
                {merchant.upiId}
              </Text>
            ) : null}

            {/* Notes */}
            {merchant.notes ? (
              <Text style={[styles.notesText, { color: subColor }]} numberOfLines={1}>
                {merchant.notes}
              </Text>
            ) : null}
          </View>

          {/* Right: copy + chevron stacked */}
          <View style={styles.rightActions}>
            <TouchableOpacity
              onPress={e => { e.stopPropagation?.(); copyUpi(); }}
              style={styles.iconBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <IconButton icon="content-copy" size={16} iconColor={subColor} style={{ margin: 0 }} />
            </TouchableOpacity>
            <Animated.View style={{
              transform: [{ rotate: animValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }],
            }}>
              <IconButton icon="chevron-down" size={18} iconColor={subColor} style={{ margin: 0 }} />
            </Animated.View>
          </View>
        </View>

        {/* ── Expandable pay buttons ── */}
        <Animated.View style={[styles.expandWrap, { height: expandHeight, opacity: expandOpacity, borderTopColor: borderColor }]}>
          <View style={styles.payActions}>
            {/* Scan QR — LEFT */}
            <TouchableOpacity
              onPress={e => { e.stopPropagation?.(); handlePayQR(); }}
              style={[styles.payBtn, styles.payBtnOutline, { borderColor: hasQR ? qrActiveColor : borderColor }]}
              activeOpacity={0.8}
            >
              <IconButton icon="qrcode-scan" size={13} iconColor={hasQR ? qrActiveColor : subColor} style={{ margin: 0 }} />
              <Text style={[styles.payBtnText, { color: hasQR ? qrActiveColor : subColor }]}>Scan QR</Text>
            </TouchableOpacity>
            {/* Pay UPI — RIGHT */}
            <TouchableOpacity
              onPress={e => { e.stopPropagation?.(); handlePayUPI(); }}
              style={[styles.payBtn, hasUPI ? { backgroundColor: accentColor } : { backgroundColor: isDark ? '#2A2A2A' : theme.colors.surfaceVariant }]}
              activeOpacity={0.8}
            >
              <IconButton icon="send" size={13} iconColor={hasUPI ? '#1a1a1a' : subColor} style={{ margin: 0 }} />
              <Text style={[styles.payBtnText, { color: hasUPI ? '#1a1a1a' : subColor }]}>Pay UPI</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>

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
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  // Left icon box
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  // Centre content
  nameMeta: { flex: 1, gap: 2 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  merchantName: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk',
    flexShrink: 1,
  },
  catChip: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexShrink: 0,
  },
  catChipText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk',
    letterSpacing: 0.5,
  },
  upiText: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk',
  },
  notesText: {
    fontSize: 11,
    fontFamily: 'SpaceGrotesk',
    opacity: 0.65,
    fontStyle: 'italic',
  },
  // Right action column
  rightActions: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
    flexShrink: 0,
  },
  iconBtn: { padding: 2 },

  // ── Expand / pay buttons ──────────────────────────────────────
  expandWrap: {
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  payActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 20,
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
