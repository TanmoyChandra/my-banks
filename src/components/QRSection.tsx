import React, { useMemo, useState } from 'react';
import {
  Clipboard,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { QREntry } from '../types';
import EmptyState from './EmptyState';
import { findBankByName } from '../constants/banks';

interface QRSectionProps {
  entries: QREntry[];
  onSetup: () => void;
}

const PAGE_GAP = 16;
const PAGE_SIDE_PADDING = 24;

const QRPayCard: React.FC<{ entry: QREntry; width: number }> = ({ entry, width }) => {
  const bankData = findBankByName(entry.bankName);
  const title = entry.name || entry.bankName || entry.upiId || 'QR Entry';
  const upiLink = entry.qrValue || `upi://pay?pa=${entry.upiId}&pn=${encodeURIComponent(entry.name || entry.bankName)}&cu=INR`;
  const qrSize = Math.min(width - 92, 270);

  const handleCopyUPI = () => {
    if (entry.upiId) Clipboard.setString(entry.upiId);
  };

  return (
    <View style={[styles.page, { width: width + PAGE_GAP }]}>
      <View style={[styles.payCard, { width }]}>
        <View style={styles.nameRow}>
          <Text variant="titleLarge" numberOfLines={1} style={styles.nameText}>
            {title}
          </Text>
        </View>

        <View style={styles.qrFrame}>
          <QRCode
            value={upiLink}
            size={qrSize}
            color="#111111"
            backgroundColor="#FFFFFF"
          />
        </View>

        <Text variant="bodySmall" style={styles.scanText}>
          Scan to pay with any UPI app
        </Text>

        <View style={styles.bankRow}>
          <View style={styles.bankLogoBox}>
            {bankData ? (
              <Image source={bankData.symbol} style={styles.bankLogo} resizeMode="contain" />
            ) : (
              <Text variant="labelMedium" style={styles.bankInitials}>
                {(entry.bankName || title).slice(0, 2).toUpperCase()}
              </Text>
            )}
          </View>
          <Text variant="bodyLarge" numberOfLines={1} style={styles.bankName}>
            {entry.bankName || 'Bank not detected'}
          </Text>
          <IconButton icon="chevron-right" size={20} iconColor="#6B6F76" style={styles.rowIcon} />
        </View>

        <View style={styles.upiRow}>
          <Text variant="bodyLarge" numberOfLines={1} style={styles.upiText}>
            UPI ID: {entry.upiId || 'Not found'}
          </Text>
          {entry.upiId ? (
            <IconButton
              icon="content-copy"
              size={20}
              iconColor="#6B6F76"
              onPress={handleCopyUPI}
              style={styles.copyButton}
            />
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

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<IconButton icon="qrcode-scan" size={48} iconColor={theme.colors.primary} />}
        title="No UPI Details Yet"
        description="Add your bank's UPI ID or scan a QR code to automatically generate and save payment details."
        actionLabel="Add UPI Entry"
        onAction={onSetup}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text variant="labelLarge" style={styles.countLabel}>
            {activeIndex + 1} of {entries.length}
          </Text>
        </View>
        <Button mode="text" icon="plus" onPress={onSetup} textColor={theme.colors.primary}>
          Add
        </Button>
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
              index === activeIndex ? styles.activeDot : styles.inactiveDot,
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
    paddingTop: 16,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  countLabel: {
    color: '#6750A4',
    fontWeight: '700',
  },
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
    backgroundColor: '#FFFFFF',
    borderColor: '#E7E0EC',
    borderRadius: 22,
    borderWidth: 1,
    minHeight: 500,
    paddingHorizontal: 22,
    paddingVertical: 28,
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
    marginBottom: 18,
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
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 12,
  },
  scanText: {
    color: '#6B6F76',
    marginTop: 12,
    textAlign: 'center',
  },
  bankRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 22,
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
    fontWeight: '700',
  },
  rowIcon: {
    margin: 0,
  },
  upiRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
    maxWidth: '92%',
  },
  upiText: {
    color: '#25232A',
    flexShrink: 1,
    fontWeight: '700',
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
    backgroundColor: '#6750A4',
    width: 22,
  },
  inactiveDot: {
    backgroundColor: '#D0C7DD',
    width: 8,
  },
});

export default QRSection;
