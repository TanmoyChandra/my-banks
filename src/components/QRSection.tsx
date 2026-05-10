import React, { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Share,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { Button, IconButton, Text, useTheme, Avatar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { QREntry } from '../types';
import { findBankByName } from '../constants/banks';
import { useUiStore } from '../store/useUiStore';

interface QRSectionProps {
  entries: QREntry[];
}

const PAGE_GAP = 16;
const PAGE_SIDE_PADDING = 24;

const QRPayCard = ({ entry, width }: { entry: QREntry; width: number }) => {
  const theme = useTheme();
  const title = entry.name || entry.bankName || entry.upiId || 'QR Entry';
  const upiLink = entry.qrValue || `upi://pay?pa=${entry.upiId}&pn=${encodeURIComponent(entry.name || entry.bankName)}&cu=INR`;
  const qrSize = Math.min(width - 92, 180);
  const viewRef = useRef<View>(null);

  const handleCopyUPI = async () => {
    if (entry.upiId) await Clipboard.setStringAsync(entry.upiId);
  };

  const handleShare = async () => {
    try {
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
      });

      if (!(await Sharing.isAvailableAsync())) {
        return;
      }

      await Sharing.shareAsync(uri, {
        dialogTitle: `Share ${title} QR Code`,
        mimeType: 'image/png',
        UTI: 'public.png',
      });
    } catch (err) {
      console.log('Error capturing/sharing view:', err);
    }
  };

  const cardBg = theme.colors.surfaceVariant;
  const cardBorder = theme.colors.outlineVariant;
  const mainTextColor = theme.colors.onSurface;
  const subTextColor = theme.colors.onSurfaceVariant;

  return (
    <View style={[styles.page, { width: width + PAGE_GAP }]}>
      <View ref={viewRef} collapsable={false} style={[styles.payCard, { width, backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.nameRow}>
          <Text variant="titleLarge" numberOfLines={1} style={[styles.nameText, { color: mainTextColor }]}>
            {title}
          </Text>
        </View>

        <View style={styles.qrFrame}>
          <QRCode
            value={upiLink}
            size={qrSize}
            color={mainTextColor}
            backgroundColor="transparent"
          />
        </View>

        <Text variant="bodySmall" style={[styles.scanText, { color: subTextColor }]}>
          Scan to pay with any UPI app
        </Text>

        <View style={styles.bankRow}>
          <View style={[styles.bankLogoBox, { backgroundColor: '#ffffff' }]}>
            {findBankByName(entry.bankName) ? (
              <Image source={findBankByName(entry.bankName)!.symbol} style={styles.bankLogo} resizeMode="contain" />
            ) : (
              <Text variant="labelMedium" style={[styles.bankInitials, { color: '#000' }]}>
                {(entry.bankName || title).slice(0, 2).toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={[styles.bankName, { color: mainTextColor }]}>
            {entry.bankName || 'Bank not detected'}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleCopyUPI}
          style={styles.upiRow}
          disabled={!entry.upiId}
        >
          <Text style={[styles.upiLabel, { color: subTextColor }]}>UPI ID:</Text>
          <Text style={[styles.upiValue, { color: mainTextColor }]}>{entry.upiId || 'Not found'}</Text>
        </TouchableOpacity>
      </View>
      
      <Button
        mode="contained"
        buttonColor={theme.colors.primaryContainer}
        textColor={theme.colors.onPrimaryContainer}
        icon="share-variant"
        onPress={handleShare}
        style={[styles.shareButton, { width }]}
        labelStyle={styles.shareButtonLabel}
      >
        Share QR code
      </Button>
    </View>
  );
};

const QRSection: React.FC<QRSectionProps> = ({ entries }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { width: screenWidth } = useWindowDimensions();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const userName = useUiStore(s => s.userName);
  const initials = userName ? userName.charAt(0).toUpperCase() : '?';
  const cardWidth = Math.min(screenWidth - PAGE_SIDE_PADDING * 2.5, 450);
  const snapWidth = cardWidth + PAGE_GAP;

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / snapWidth);
    setActiveIndex(Math.max(0, Math.min(entries.length - 1, index)));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.sectionIntro}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={[styles.introTitle, { color: theme.colors.onSurface }]}>My QR codes</Text>
            <Text style={[styles.introText, { color: theme.dark ? '#a1a1aa' : '#52525b' }]}>
              Easily share your QR codes to receive payments from any UPI app.
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

      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>Add new</Text>
        </View>
      ) : (
        <>
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
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionIntro: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 },
  introTitle: { fontSize: 28, fontWeight: '700', marginBottom: 6, fontFamily: 'SpaceGrotesk', letterSpacing: -0.5 },
  introText: { fontSize: 14, fontFamily: 'SpaceGrotesk', lineHeight: 20 },
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
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    maxWidth: '100%',
  },
  nameText: {
    color: '#25232A',
    flexShrink: 1,
    fontWeight: '500',
  },
  qrFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanText: {
    color: '#6B6F76',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 10,
  },
  bankRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 20,
    maxWidth: '88%',
  },
  bankLogoBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#ECE6F0',
    borderRadius: 5,
    borderWidth: 1,
    height: 25,
    justifyContent: 'center',
    marginRight: 6,
    width: 44,
  },
  bankLogo: {
    height: 22,
    width: 45,
  },
  bankInitials: {
    color: '#202124',
    fontWeight: '800',
  },
  bankName: {
    color: '#25232A',
    flexShrink: 1,
    fontWeight: '600',
    fontSize: 15,
  },
  upiRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 23,
    width: '100%',
  },
  upiLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  upiValue: {
    fontSize: 13,
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
    backgroundColor: '#09090b',
    width: 22,
  },
  inactiveDot: {
    backgroundColor: '#d4d4d8',
    width: 8,
  },
  shareButton: {
    marginTop: 16,
    borderRadius: 24,
  },
  shareButtonLabel: {
    fontWeight: '900',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '900',
    opacity: 0.3,
  },
});

export default QRSection;
