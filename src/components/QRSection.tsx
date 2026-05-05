import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Share,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { QREntry } from '../types';

import { findBankByName } from '../constants/banks';

interface QRSectionProps {
  entries: QREntry[];
  onSetup: () => void;
}

const PAGE_GAP = 16;
const PAGE_SIDE_PADDING = 24;

const QRPayCard = ({ entry, width }: { entry: QREntry; width: number }) => {
  const theme = useTheme();
  const title = entry.name || entry.bankName || entry.upiId || 'QR Entry';
  const upiLink = entry.qrValue || `upi://pay?pa=${entry.upiId}&pn=${encodeURIComponent(entry.name || entry.bankName)}&cu=INR`;
  const qrSize = Math.min(width - 92, 180);

  const handleCopyUPI = async () => {
    if (entry.upiId) await Clipboard.setStringAsync(entry.upiId);
  };

  const handleShare = async () => {
    const upiId = entry.upiId || '';
    const name = entry.name || entry.bankName || 'UPI Payment';
    try {
      await Share.share({
        message: `Pay ${name} via UPI\nUPI ID: ${upiId}\n${upiLink}`,
      });
    } catch {}
  };

  return (
    <View style={[styles.page, { width: width + PAGE_GAP }]}>
      <View style={[styles.payCard, { width, backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
        <View style={styles.nameRow}>
          <Text variant="titleLarge" numberOfLines={1} style={[styles.nameText, { color: theme.colors.onSurface }]}>
            {title}
          </Text>
        </View>

        <View style={[styles.qrFrame, { backgroundColor: '#FFFFFF' }]}>
          <QRCode
            value={upiLink}
            size={qrSize}
            color="#111111"
            backgroundColor="#FFFFFF"
          />
        </View>

        <Text variant="bodySmall" style={[styles.scanText, { color: theme.colors.onSurfaceVariant }]}>
          Scan to pay with any UPI app
        </Text>

        <View style={styles.bankRow}>
          <View style={[styles.bankLogoBox, { backgroundColor: theme.dark ? '#f4f4f5' : '#ffffff' }]}>
            {findBankByName(entry.bankName) ? (
              <Image source={findBankByName(entry.bankName)!.symbol} style={styles.bankLogo} resizeMode="contain" />
            ) : (
              <Text variant="labelMedium" style={[styles.bankInitials, { color: '#000' }]}>
                {(entry.bankName || title).slice(0, 2).toUpperCase()}
              </Text>
            )}
          </View>
          <Text variant="bodyLarge" numberOfLines={1} style={[styles.bankName, { color: theme.colors.onSurface }]}>
            {entry.bankName || 'Bank not detected'}
          </Text>
          <IconButton icon="chevron-right" size={20} iconColor={theme.colors.onSurfaceVariant} style={styles.rowIcon} />
        </View>

        <View style={styles.upiRow}>
          <Text variant="bodyLarge" numberOfLines={1} style={[styles.upiText, { color: theme.colors.onSurface }]}>
            UPI ID: {entry.upiId || 'Not found'}
          </Text>
          {entry.upiId ? (
            <>
              <IconButton
                icon="content-copy"
                size={20}
                iconColor={theme.colors.onSurfaceVariant}
                onPress={handleCopyUPI}
                style={styles.copyButton}
              />
              <IconButton
                icon="share-variant"
                size={20}
                iconColor={theme.colors.onSurfaceVariant}
                onPress={handleShare}
                style={styles.copyButton}
              />
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const QRSection: React.FC<QRSectionProps> = ({ entries, onSetup }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { width: screenWidth } = useWindowDimensions();
  const theme = useTheme();
  const cardWidth = Math.min(screenWidth - PAGE_SIDE_PADDING * 2, 620);
  const snapWidth = cardWidth + PAGE_GAP;

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / snapWidth);
    setActiveIndex(Math.max(0, Math.min(entries.length - 1, index)));
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionIntro}>
        <View style={styles.introHeader}>
          <View style={styles.introIconBox}>
            <IconButton icon="qrcode" size={24} iconColor="#000000" />
          </View>
          <Button mode="contained" buttonColor={theme.dark ? '#FFFFFF' : '#000000'} textColor={theme.dark ? '#000000' : '#FFFFFF'} icon="plus" onPress={onSetup} style={styles.addButton} labelStyle={styles.addButtonLabel}>
            Add
          </Button>
        </View>
        <Text style={[styles.introTitle, { color: theme.colors.onSurface }]}>Saved UPI identities</Text>
        <Text style={[styles.introText, { color: theme.dark ? '#a1a1aa' : '#52525b' }]}>Scan, import, copy, or share payment addresses without searching through screenshots.</Text>
      </View>

      <FlatList
        data={entries}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <QRPayCard entry={item} width={cardWidth} />}
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapWidth}
        decelerationRate="fast"
        contentContainerStyle={styles.carouselContent}
        onMomentumScrollEnd={handleMomentumEnd}
      />

      <View style={styles.dots}>
        {entries.map((entry, index) => (
          <View
            key={entry.id}
            style={[
              styles.dot,
              index === activeIndex ? [styles.activeDot, { backgroundColor: theme.colors.onSurface }] : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionIntro: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 },
  introHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  introIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#BEF264', alignItems: 'center', justifyContent: 'center' },
  addButton: { borderRadius: 24 },
  addButtonLabel: { fontWeight: '900', fontSize: 14 },
  introTitle: { fontSize: 28, fontWeight: '900', color: '#09090b', marginTop: 20, letterSpacing: -0.5 },
  introText: { fontSize: 14, lineHeight: 24, color: '#52525b', marginTop: 8 },
  carouselContent: {
    paddingLeft: PAGE_SIDE_PADDING,
    paddingRight: PAGE_SIDE_PADDING - PAGE_GAP,
    paddingBottom: 12,
  },
  page: {
    paddingRight: PAGE_GAP,
  },
  payCard: {
    alignItems: 'center',
    borderRadius: 32,
    borderWidth: 1,
    marginRight: PAGE_GAP,
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    maxWidth: '100%',
  },
  nameText: {
    color: '#25232A',
    flexShrink: 1,
    fontWeight: '500',
  },
  qrFrame: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#ECE6F0',
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 8,
  },
  scanText: {
    color: '#6B6F76',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
  },
  bankRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 12,
    maxWidth: '88%',
  },
  bankLogoBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#ECE6F0',
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    marginRight: 14,
    width: 58,
  },
  bankLogo: {
    height: 29,
    width: 46,
  },
  bankInitials: {
    color: '#202124',
    fontWeight: '800',
  },
  bankName: {
    color: '#25232A',
    flexShrink: 1,
    fontWeight: '900',
    fontSize: 18,
  },
  rowIcon: {
    margin: 0,
  },
  upiRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    maxWidth: '92%',
  },
  upiText: {
    color: '#25232A',
    flexShrink: 1,
    fontWeight: '900',
    fontSize: 18,
  },
  copyButton: {
    margin: 0,
    marginLeft: 4,
  },
  dots: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 18,
    paddingTop: 4,
  },
  dot: {
    borderRadius: 999,
    height: 8,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#09090b',
    width: 22,
  },
  inactiveDot: {
    backgroundColor: '#d4d4d8',
    width: 8,
  },
});

export default QRSection;
