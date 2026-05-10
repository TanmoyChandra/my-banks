import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Button, IconButton, Text, useTheme, Avatar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { findBankByName } from '../constants/banks';
import { CardEntry } from '../types';
import { getCardColors } from '../constants/cardColors';
import { useUiStore } from '../store/useUiStore';

interface CardsSectionProps {
  cards: CardEntry[];
  onCardPress?: (card: CardEntry) => void;
}

const formatCardNumber = (num: string) => {
  const clean = num.replace(/\D/g, '').slice(0, 16);
  if (!clean) return '0000 0000 0000 0000';
  return clean.replace(/(.{4})/g, '$1  ').trim();
};

const maskCardNumber = (num: string) => {
  const clean = num.replace(/\D/g, '').slice(0, 16);
  if (clean.length < 4) return num || '0000 0000 0000 0000';
  return `••••  ••••  ••••  ${clean.slice(-4)}`;
};

const networkName = (card: CardEntry) => {
  const clean = card.cardNumber.replace(/\D/g, '');
  if (/^5[1-5]/.test(clean)) return 'Master Card';
  if (/^6(?:0|5|52|53)/.test(clean)) return 'RuPay';
  return 'Visa';
};

const WaveTexture = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width="100%" height="100%" viewBox="0 0 400 240" preserveAspectRatio="none">
      {Array.from({ length: 30 }).map((_, index) => {
        const y = -40 + index * 10;
        const bend = index % 2 === 0 ? 30 : -20;
        return (
          <Path
            key={index}
            d={`M-100 ${y} C 100 ${y + bend}, 200 ${y - bend}, 300 ${y} S 500 ${y + bend}, 600 ${y}`}
            stroke="rgba(255,255,255,0.09)"
            strokeWidth="1.5"
            fill="none"
          />
        );
      })}
      <Path
        d="M-100 240 C 100 120, 200 120, 300 180 S 500 240, 600 100"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="30"
        fill="none"
      />
    </Svg>
  </View>
);

const NetworkMark = ({ card, fallbackLabel, textColor }: { card: CardEntry; fallbackLabel: string; textColor: string }) => {
  const bankData = findBankByName(card.bankName);
  const label = card.bankName || fallbackLabel;
  const isRupay = label === 'RuPay';
  if (isRupay) {
    return <Text style={[styles.rupayText, { color: textColor }]}>RuPay</Text>;
  }

  return (
    <View style={styles.networkRow}>
      {bankData ? (
        <Image source={bankData.symbol} style={styles.bankLogo} resizeMode="contain" />
      ) : (
        <Text variant="labelMedium" style={[styles.bankInitials, { color: textColor }]}>
          {label.slice(0, 2).toUpperCase()}
        </Text>
      )}
      <Text variant="titleMedium" numberOfLines={1} adjustsFontSizeToFit style={[styles.networkLabel, { color: textColor }]}>{label}</Text>
    </View>
  );
};




const BankCard: React.FC<{ card: CardEntry; index: number; onPress: () => void }> = ({ card, index, onPress }) => {
  const theme = useTheme();
  const network = networkName(card);
  const [showCvv, setShowCvv] = useState(false);

  const { bg: backgroundColor, textColor, mutedColor } = getCardColors(card.color, theme.dark);

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={styles.cardBlock}
    >
      {/* Main card face */}
      <View style={[styles.cardFace, { backgroundColor }]}>
        <WaveTexture />

        <View style={styles.topRow}>
          <NetworkMark card={card} fallbackLabel={network} textColor={textColor} />
          <View style={[styles.cardTypeBadge, { borderColor: 'rgba(255,255,255,0.3)' }]}>
            <Text style={[styles.cardTypeBadgeText, { color: textColor }]}>
              {card.type?.toUpperCase() ?? 'DEBIT'}
            </Text>
          </View>
        </View>

        <View style={styles.numberBlock}>
          <Text variant="titleMedium" numberOfLines={1} adjustsFontSizeToFit style={[styles.cardHolderName, { color: textColor }]}>
            {(card.holderName || 'Card Holder').replace(/\s+/g, ' ')}
          </Text>
          <Text variant="headlineSmall" numberOfLines={1} adjustsFontSizeToFit style={[styles.cardNumber, { color: textColor }]}>
            {formatCardNumber(card.cardNumber)}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.holderBlock}>
            <Text variant="bodySmall" style={[styles.validLabel, { color: mutedColor }]}>Valid Thru</Text>
            <Text variant="titleMedium" style={[styles.validValue, { color: textColor }]}>{card.expiry || 'MM/YY'}</Text>
          </View>

          <View style={styles.validBlock}>
            <Text variant="bodySmall" style={[styles.validLabel, { color: mutedColor }]}>CVV</Text>
            <Text
              variant="titleMedium"
              style={[styles.validValue, { color: textColor }]}
              onPress={(e) => { e.stopPropagation?.(); if (card.cvv) setShowCvv(!showCvv); }}
            >
              {card.cvv ? (showCvv ? card.cvv : '***') : '***'}
            </Text>
          </View>

          {/* Tap hint */}
          <View style={styles.tapHint}>
            <Text style={[styles.tapHintText, { color: mutedColor }]}>Tap for transactions →</Text>
          </View>
        </View>
      </View>

      {/* Quick copy actions below card */}
      <View style={styles.cardActions}>
        <Button compact mode="text" textColor={theme.colors.onSurface} icon="content-copy" labelStyle={{ fontSize: 12, fontFamily: 'SpaceGrotesk' }}
          onPress={(e) => { Clipboard.setStringAsync(card.holderName || ''); }}>
          Name
        </Button>
        <Button compact mode="text" textColor={theme.colors.onSurface} icon="content-copy" labelStyle={{ fontSize: 12, fontFamily: 'SpaceGrotesk' }}
          onPress={() => Clipboard.setStringAsync(card.cardNumber.replace(/\D/g, ''))}>
          Number
        </Button>
        <Button compact mode="text" textColor={theme.colors.onSurface} icon="content-copy" labelStyle={{ fontSize: 12, fontFamily: 'SpaceGrotesk' }}
          onPress={() => Clipboard.setStringAsync(card.expiry || '')}>
          Date
        </Button>
        <Button compact mode="text" textColor={theme.colors.onSurface} icon="content-copy" labelStyle={{ fontSize: 12, fontFamily: 'SpaceGrotesk' }}
          onPress={() => Clipboard.setStringAsync(card.cvv || '')}>
          CVV
        </Button>
      </View>
    </TouchableOpacity>
  );
};

const CardsSection: React.FC<CardsSectionProps> = ({ cards, onCardPress = () => {} }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const userName = useUiStore(s => s.userName);
  const initials = userName ? userName.charAt(0).toUpperCase() : '?';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.sectionIntro}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={[styles.introTitle, { color: theme.colors.onSurface }]}>Payment cards</Text>
            <Text style={[styles.introText, { color: theme.dark ? '#a1a1aa' : '#52525b' }]}>
              Tap a card to view & manage transactions. CVV stays masked until tapped.
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {cards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Avatar.Icon size={64} icon="credit-card-outline" style={{ backgroundColor: theme.colors.surfaceVariant, marginBottom: 16 }} color={theme.colors.primary} />
            <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>No cards yet</Text>
            <Text style={[styles.emptySubText, { color: theme.colors.onSurfaceVariant }]}>
              Open the menu to add your first card
            </Text>
          </View>
        ) : (
          cards.map((card, index) => (
            <BankCard
              key={card.id}
              card={card}
              index={index}
              onPress={() => onCardPress(card)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionIntro: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 },
  introTitle: { fontSize: 28, fontWeight: '700', marginBottom: 6, fontFamily: 'SpaceGrotesk', letterSpacing: -0.5 },
  introText: { fontSize: 14, fontFamily: 'SpaceGrotesk', lineHeight: 20 },
  introIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#AAEF00', alignItems: 'center', justifyContent: 'center' },
  addButton: { borderRadius: 24 },
  addButtonLabel: { fontWeight: '900', fontSize: 14 },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 96 },

  // 3D card
  cardBlock: {
    marginBottom: 28,
    position: 'relative',
  },
  cardFace: {
    aspectRatio: 1.72,
    backgroundColor: '#040404',
    borderRadius: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingVertical: 20,
    // Rich shadow for premium depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 18,
    // Subtle highlight on top-left edge
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.14)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.08)',
  },

  topRow: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  cardTypeBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardTypeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontFamily: 'SpaceGrotesk',
    opacity: 0.8,
  },
  networkRow: { alignItems: 'center', flex: 1, flexDirection: 'row', marginRight: 12 },
  bankLogo: { height: 24, width: 24 },
  bankInitials: { color: '#040404', fontWeight: '800' },
  networkLabel: { color: '#F6F6F6', flex: 1, fontWeight: '900', marginLeft: 8, fontFamily: 'SpaceGrotesk' },
  rupayText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', fontFamily: 'SpaceGrotesk' },

  numberBlock: { marginTop: 13 },
  cardHolderName: { color: '#FFFFFF', fontWeight: '900', letterSpacing: 1, marginBottom: 8, fontFamily: 'SpaceGrotesk' },
  cardNumber: { color: '#FFFFFF', fontWeight: '900', letterSpacing: 4, fontSize: 24, fontFamily: 'SpaceGrotesk' },

  bottomRow: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' },
  holderBlock: { flex: 1, marginRight: 16 },
  validBlock: { alignItems: 'flex-start', minWidth: 78 },
  validLabel: { color: '#FFFFFF', marginTop: 14, fontWeight: '700', fontSize: 12, opacity: 0.7 },
  validValue: { color: '#FFFFFF', fontWeight: '900', fontFamily: 'SpaceGrotesk' },

  tapHint: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  tapHintText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontFamily: 'SpaceGrotesk',
  },

  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingHorizontal: 4,
    marginTop: 4,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyText: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'SpaceGrotesk',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default CardsSection;
