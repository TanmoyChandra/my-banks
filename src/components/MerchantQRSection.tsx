import React, { useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Linking,
  Alert
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { useNavigation } from '@react-navigation/native';
import { Button, Text, useTheme, Avatar, Icon } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { MerchantQR } from '../types';
import { useWalletStore } from '../store/useWalletStore';

const PAGE_GAP = 16;
const PAGE_SIDE_PADDING = 24;

const MerchantPayCard = ({ merchant, width }: { merchant: MerchantQR; width: number }) => {
  const theme = useTheme();
  const upiLink = merchant.qrValue || (merchant.upiId ? `upi://pay?pa=${merchant.upiId}&pn=${encodeURIComponent(merchant.name)}&cu=INR` : '');
  const qrSize = Math.min(width - 92, 180);
  const viewRef = useRef<View>(null);

  const handleShare = async () => {
    if (!merchant.upiId) return;
    try {
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
      });

      if (!(await Sharing.isAvailableAsync())) {
        return;
      }

      await Sharing.shareAsync(uri, {
        dialogTitle: `Share ${merchant.name} QR Code`,
        mimeType: 'image/png',
        UTI: 'public.png',
      });
    } catch (err) {
      console.log('Error capturing/sharing view:', err);
    }
  };

  const handlePay = async () => {
    if (!merchant.upiId) {
      Alert.alert('No UPI ID', 'This merchant does not have a UPI ID set.');
      return;
    }
    const canOpen = await Linking.canOpenURL(upiLink);
    if (canOpen) {
      await Linking.openURL(upiLink);
    } else {
      Alert.alert('No UPI App Found', 'Please install a UPI payment app (GPay, PhonePe, Paytm, etc.) to make payments.');
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
            {merchant.name}
          </Text>
        </View>

        <View style={[styles.qrFrame, !merchant.upiId && { opacity: 0.2 }]}>
          {merchant.upiId ? (
            <QRCode
              value={upiLink}
              size={qrSize}
              color={mainTextColor}
              backgroundColor="transparent"
            />
          ) : (
            <View style={{ width: qrSize, height: qrSize, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: cardBorder, borderStyle: 'dashed', borderRadius: 16 }}>
              <Avatar.Icon icon="qrcode-scan" size={64} color={subTextColor} style={{ backgroundColor: 'transparent' }} />
              <Text style={{ color: subTextColor, fontFamily: 'SpaceGrotesk', marginTop: 8 }}>No QR</Text>
            </View>
          )}
        </View>

        <Text variant="bodySmall" style={[styles.scanText, { color: subTextColor }]}>
          {merchant.upiId ? "Scan to pay with any UPI app" : "Edit merchant to add UPI ID"}
        </Text>

        <View style={styles.bankRow}>
          <Icon source="storefront-outline" size={20} color={subTextColor} />
          <Text style={[styles.bankName, { color: mainTextColor, marginLeft: 8 }]}>
            {merchant.category || 'Merchant'}
          </Text>
        </View>

        <View style={styles.upiRow}>
          <Text style={[styles.upiLabel, { color: subTextColor }]}>UPI ID:</Text>
          <Text style={[styles.upiValue, { color: mainTextColor }]}>{merchant.upiId || 'Not found'}</Text>
        </View>
      </View>
      
      <View style={{ flexDirection: 'row', gap: 8, width, marginTop: 16 }}>
        <Button
          mode="outlined"
          textColor={theme.colors.onSurface}
          icon="share-variant"
          onPress={handleShare}
          style={{ flex: 1 }}
          disabled={!merchant.upiId}
          contentStyle={{ height: 48 }}
        >
          Share
        </Button>
        <Button
          mode="contained"
          buttonColor={theme.colors.primaryContainer}
          textColor={theme.colors.onPrimaryContainer}
          icon="send"
          onPress={handlePay}
          style={{ flex: 1 }}
          disabled={!merchant.upiId}
          contentStyle={{ height: 48 }}
        >
          Pay via UPI
        </Button>
      </View>
    </View>
  );
};

export default function MerchantQRSection({ hideHeader }: { hideHeader?: boolean }) {
  const { width: screenWidth } = useWindowDimensions();
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const merchants = useWalletStore(s => s.merchantQRs);

  const cardWidth = screenWidth - PAGE_SIDE_PADDING * 2;
  const snapWidth = cardWidth + PAGE_GAP;

  const data = [...merchants, { id: 'add-placeholder', isAdd: true }];

  return (
    <View style={styles.carouselWrapper}>
      <FlatList
        data={data as any[]}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (item.isAdd) {
            return (
              <View style={[styles.page, { width: cardWidth + PAGE_GAP }]}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('SetupMerchantQR')}
                  style={[styles.payCard, { 
                    width: cardWidth, 
                    backgroundColor: theme.dark ? '#2A2A2A' : '#FFFFFF', 
                    justifyContent: 'center', 
                    height: Math.min(cardWidth - 92, 180) + 190,
                    borderWidth: 0
                  }]}
                >
                  <Avatar.Icon size={64} icon="plus" style={{ backgroundColor: 'transparent' }} color={theme.colors.onSurfaceVariant} />
                  <Text style={{ marginTop: 16, color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk', fontWeight: '600' }}>Add new Merchant</Text>
                </TouchableOpacity>
              </View>
            );
          }
          return <MerchantPayCard merchant={item as MerchantQR} width={cardWidth} />;
        }}
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapWidth}
        decelerationRate="fast"
        contentContainerStyle={styles.carouselContent}
        style={{ flexGrow: 0 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontFamily: 'SpaceGrotesk',
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
    fontFamily: 'SpaceGrotesk',
  },
  bankRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 20,
    maxWidth: '88%',
  },
  bankLogoBox: {
    alignItems: 'center',
    borderColor: '#ECE6F0',
    borderRadius: 5,
    borderWidth: 1,
    height: 25,
    justifyContent: 'center',
    marginRight: 6,
    width: 44,
  },
  bankInitials: {
    fontWeight: '800',
  },
  bankName: {
    flexShrink: 1,
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'SpaceGrotesk',
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
    fontFamily: 'SpaceGrotesk',
  },
  upiValue: {
    fontSize: 13,
    fontWeight: '700',
  },
});
