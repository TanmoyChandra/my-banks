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
  Animated,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { useNavigation } from '@react-navigation/native';
import { Button, IconButton, Text, useTheme, Avatar, Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { QREntry } from '../types';
import { findBankByName } from '../constants/banks';
import { useUiStore } from '../store/useUiStore';
import MerchantQRSection from './MerchantQRSection';

const initials = (name: string) => name ? name.charAt(0).toUpperCase() : '?';

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
  const { width: screenWidth } = useWindowDimensions();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const userName = useUiStore(s => s.userName);
  const userImage = useUiStore(s => s.userImage);
  const initials = userName ? userName.charAt(0).toUpperCase() : '?';
  const cardWidth = Math.min(screenWidth - PAGE_SIDE_PADDING * 2.5, 450);
  const snapWidth = cardWidth + PAGE_GAP;
  
  const [activeTab, setActiveTab] = useState<'my_qr' | 'merchant_qr'>('my_qr');
  const tabAnim = useRef(new Animated.Value(0)).current;

  const handleTabChange = (tab: 'my_qr' | 'merchant_qr') => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    Animated.spring(tabAnim, {
      toValue: tab === 'my_qr' ? 0 : 1,
      useNativeDriver: true,
      bounciness: 4,
      speed: 12,
    }).start();
  };

  // Interpolations for smooth transitions
  const tabIndicatorTranslate = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (screenWidth - 48 - 8) / 2] // (containerWidth - padding) / 2
  });

  const myQrOpacity = tabAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const merchantOpacity = tabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const myQrTranslate = tabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const merchantTranslate = tabAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.sectionIntro}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={[styles.introTitle, { color: theme.colors.onSurface }]}>UPI / QR Codes</Text>
            <Text style={[styles.introText, { color: theme.dark ? '#a1a1aa' : '#52525b' }]}>
              Easily share your QR codes to receive payments from any UPI app.
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            {userImage ? (
              <Avatar.Image size={40} source={{ uri: userImage }} />
            ) : (
              <Avatar.Text 
                size={40} 
                label={initials} 
                style={{ backgroundColor: theme.colors.primaryContainer }} 
                labelStyle={{ color: theme.colors.onPrimaryContainer, fontWeight: '700' }}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Segmented Tabs */}
        <View style={[styles.tabContainer, { backgroundColor: theme.dark ? '#2A2A2A' : '#F2F2F7' }]}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                width: '50%',
                backgroundColor: theme.colors.surface,
                borderRadius: 8,
                top: 4, bottom: 4, left: 4,
                shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
                transform: [{ translateX: tabIndicatorTranslate }]
              }
            ]}
          />
          <TouchableOpacity
            style={[styles.tabButton, { flexDirection: 'row', justifyContent: 'center', gap: 6 }]}
            onPress={() => handleTabChange('my_qr')}
            activeOpacity={1}
          >
            <Icon source="qrcode" size={16} color={activeTab === 'my_qr' ? theme.colors.onSurface : '#8E8E93'} />
            <Text style={[styles.tabText, activeTab === 'my_qr' && { color: theme.colors.onSurface, fontWeight: '700' }]}>My UPI/QRs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, { flexDirection: 'row', justifyContent: 'center', gap: 6 }]}
            onPress={() => handleTabChange('merchant_qr')}
            activeOpacity={1}
          >
            <Icon source="storefront-outline" size={16} color={activeTab === 'merchant_qr' ? theme.colors.onSurface : '#8E8E93'} />
            <Text style={[styles.tabText, activeTab === 'merchant_qr' && { color: theme.colors.onSurface, fontWeight: '700' }]}>Merchant UPI/QRs</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <Animated.View 
          style={[
            StyleSheet.absoluteFill, 
            { opacity: myQrOpacity, transform: [{ translateX: myQrTranslate }], zIndex: activeTab === 'my_qr' ? 1 : 0 }
          ]} 
          pointerEvents={activeTab === 'my_qr' ? 'auto' : 'none'}
        >
          <View style={styles.carouselWrapper}>
            <FlatList
              data={[...entries, { id: 'add-placeholder', isAdd: true } as any]}
              horizontal
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                if (item.isAdd) {
                  return (
                    <View style={[styles.page, { width: cardWidth + PAGE_GAP }]}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('SetupQR')}
                        style={[styles.payCard, { 
                          width: cardWidth, 
                          backgroundColor: theme.dark ? '#2A2A2A' : '#FFFFFF', 
                          justifyContent: 'center', 
                          height: Math.min(cardWidth - 92, 180) + 190,
                          borderWidth: 0
                        }]}
                      >
                        <Avatar.Icon size={64} icon="plus" style={{ backgroundColor: 'transparent' }} color={theme.colors.onSurfaceVariant} />
                        <Text style={{ marginTop: 16, color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk', fontWeight: '600' }}>Add new QR code</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }
                return <QRPayCard entry={item as QREntry} width={cardWidth} />;
              }}
              showsHorizontalScrollIndicator={false}
              snapToInterval={snapWidth}
              decelerationRate="fast"
              contentContainerStyle={styles.carouselContent}
              style={{ flexGrow: 0 }}
            />
          </View>
        </Animated.View>

        <Animated.View 
          style={[
            StyleSheet.absoluteFill, 
            { opacity: merchantOpacity, transform: [{ translateX: merchantTranslate }], zIndex: activeTab === 'merchant_qr' ? 1 : 0 }
          ]} 
          pointerEvents={activeTab === 'merchant_qr' ? 'auto' : 'none'}
        >
          <MerchantQRSection hideHeader />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionIntro: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8 },
  introTitle: { fontSize: 28, fontWeight: '700', marginBottom: 6, fontFamily: 'SpaceGrotesk', letterSpacing: -0.5 },
  introText: { fontSize: 14, fontFamily: 'SpaceGrotesk', lineHeight: 20 },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 20,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk',
    color: '#8E8E93',
  },
  carouselWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  carouselContent: {
    paddingLeft: PAGE_SIDE_PADDING,
    paddingRight: PAGE_SIDE_PADDING - PAGE_GAP,
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
    fontWeight: '800',
  },
  bankName: {
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
  shareButton: {
    marginTop: 16,
    borderRadius: 24,
  },
  shareButtonLabel: {
    fontWeight: '900',
    fontSize: 16,
  },
  emptyContainer: {
    paddingBottom: 40,
  },
});

export default QRSection;
