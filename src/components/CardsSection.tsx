import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';
import { findBankByName } from '../constants/banks';
import { CardEntry } from '../types';

interface CardsSectionProps {
  cards: CardEntry[];
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
  return 'Master Card';
};

const productName = (card: CardEntry) => {
  if (card.nickname.trim()) return card.nickname;
  return card.type === 'Credit' ? 'Credit Card' : 'Debit Card';
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
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1.5"
            fill="none"
          />
        );
      })}
      <Path
        d="M-100 240 C 100 120, 200 120, 300 180 S 500 240, 600 100"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="30"
        fill="none"
      />
    </Svg>
  </View>
);

const NetworkMark = ({ card, fallbackLabel }: { card: CardEntry; fallbackLabel: string }) => {
  const bankData = findBankByName(card.bankName);
  const label = card.bankName || fallbackLabel;
  const isRupay = label === 'RuPay';
  if (isRupay) {
    return <Text style={styles.rupayText}>RuPay</Text>;
  }

  return (
    <View style={styles.networkRow}>
        {bankData ? (
          <Image source={bankData.symbol} style={styles.bankLogo} resizeMode="contain" />
        ) : (
          <Text variant="labelMedium" style={styles.bankInitials}>
            {label.slice(0, 2).toUpperCase()}
          </Text>
        )}
      <Text variant="titleMedium" numberOfLines={1} adjustsFontSizeToFit style={styles.networkLabel}>{label}</Text>
    </View>
  );
};

const Chip = () => (
  <View style={styles.chip}>
    <View style={styles.chipGrid}>
      <View style={styles.chipLineH} />
      <View style={[styles.chipLineH, { top: 24 }]} />
      <View style={styles.chipLineV} />
      <View style={[styles.chipLineV, { left: 42 }]} />
      <View style={styles.chipCenter} />
    </View>
  </View>
);

const BankCard: React.FC<{ card: CardEntry; index: number }> = ({ card, index }) => {
  const theme = useTheme();
  const network = networkName(card);
  const [showCvv, setShowCvv] = useState(false);

  const cardColors = theme.dark 
    ? ['#1c1917', '#450a0a', '#064e3b', '#1e1b4b', '#18181b'] // stone, red, emerald, indigo, zinc
    : ['#040404'];
  const backgroundColor = card.color || cardColors[index % cardColors.length];

  return (
    <View style={styles.cardBlock}>
      <View style={[styles.cardFace, { backgroundColor }]}>
        <WaveTexture />

        <View style={styles.topRow}>
          <NetworkMark card={card} fallbackLabel={network} />
          <Chip />
        </View>

        <View style={styles.numberBlock}>
          <Text variant="titleMedium" numberOfLines={1} adjustsFontSizeToFit style={styles.cardHolderName}>
            {(card.holderName || 'Card Holder').replace(/\s+/g, ' ')}
          </Text>
          <Text variant="headlineSmall" numberOfLines={1} adjustsFontSizeToFit style={styles.cardNumber}>
            {formatCardNumber(card.cardNumber)}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.holderBlock}>
            <Text variant="bodySmall" style={styles.validLabel}>Valid Thru</Text>
            <Text variant="titleMedium" style={styles.validValue}>{card.expiry || 'MM/YY'}</Text>
          </View>

          <View style={styles.validBlock}>
            <Text variant="bodySmall" style={styles.validLabel}>CVV</Text>
            <Text 
              variant="titleMedium" 
              style={styles.validValue}
              onPress={() => { if (card.cvv) setShowCvv(!showCvv); }}
            >
              {card.cvv ? (showCvv ? card.cvv : '***') : '***'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <Button compact mode="text" textColor={theme.colors.onSurface} icon="content-copy" labelStyle={{ fontSize: 12 }} onPress={() => Clipboard.setStringAsync(card.holderName || '')}>
          Name
        </Button>
        <Button compact mode="text" textColor={theme.colors.onSurface} icon="content-copy" labelStyle={{ fontSize: 12 }} onPress={() => Clipboard.setStringAsync(card.cardNumber.replace(/\D/g, ''))}>
          Number
        </Button>
        <Button compact mode="text" textColor={theme.colors.onSurface} icon="content-copy" labelStyle={{ fontSize: 12 }} onPress={() => Clipboard.setStringAsync(card.expiry || '')}>
          Date
        </Button>
        <Button compact mode="text" textColor={theme.colors.onSurface} icon="content-copy" labelStyle={{ fontSize: 12 }} onPress={() => Clipboard.setStringAsync(card.cvv || '')}>
          CVV
        </Button>
      </View>
    </View>
  );
};

const CardsSection: React.FC<CardsSectionProps> = ({ cards }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.sectionIntro}>
        <Text style={[styles.introTitle, { color: theme.colors.onSurface }]}>Payment cards</Text>
        <Text style={[styles.introText, { color: theme.dark ? '#a1a1aa' : '#52525b' }]}>CVV stays masked until tapped. Each field has its own quick copy action.</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {cards.length === 0 ? (
          <Text style={styles.emptyText}>No cards found.</Text>
        ) : (
          cards.map((card, index) => <BankCard key={card.id} card={card} index={index} />)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionIntro: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 },
  introHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  introIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#BEF264', alignItems: 'center', justifyContent: 'center' },
  addButton: { borderRadius: 24 },
  addButtonLabel: { fontWeight: '900', fontSize: 14 },
  introTitle: { fontSize: 28, fontWeight: '900', color: '#09090b', marginTop: 0, letterSpacing: -0.5 },
  introText: { fontSize: 14, lineHeight: 24, color: '#52525b', marginTop: 8 },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 96 },
  cardBlock: { marginBottom: 22 },
  cardFace: {
    aspectRatio: 1.72,
    backgroundColor: '#040404',
    borderRadius: 18,
    justifyContent: 'space-between',
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  networkRow: { alignItems: 'center', flex: 1, flexDirection: 'row', marginRight: 12 },
  bankLogoBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 32,
  },
  bankLogo: { height: 24, width: 24 },
  bankInitials: { color: '#040404', fontWeight: '800' },
  networkLabel: { color: '#F6F6F6', flex: 1, fontWeight: '900', marginLeft: 8 },
  rupayText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  chip: {
    backgroundColor: '#E0B545',
    borderRadius: 8,
    height: 37,
    overflow: 'hidden',
    width: 57,
  },
  chipGrid: { flex: 1 },
  chipLineH: {
    backgroundColor: 'rgba(75,55,10,0.55)',
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 10,
  },
  chipLineV: {
    backgroundColor: 'rgba(75,55,10,0.55)',
    bottom: 0,
    left: 14,
    position: 'absolute',
    top: 0,
    width: 1,
  },
  chipCenter: {
    borderColor: 'rgba(75,55,10,0.55)',
    borderRadius: 4,
    borderWidth: 1,
    height: 22,
    left: 20,
    position: 'absolute',
    top: 7,
    width: 18,
  },
  numberBlock: { marginTop: 13 },
  fieldLabel: { color: '#D9D9D9', marginBottom: 4 },
  cardHolderName: { color: '#FFFFFF', fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  cardNumber: { color: '#FFFFFF', fontWeight: '900', letterSpacing: 4, fontSize: 24 },
  bottomRow: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' },
  holderBlock: { flex: 1, marginRight: 16 },
  holderName: { color: '#FFFFFF', fontWeight: '900', letterSpacing: 2 },
  cardType: { color: '#D8D8D8', marginTop: 4 },
  validBlock: { alignItems: 'flex-start', minWidth: 78 },
  validLabel: { color: '#FFFFFF', marginTop: 14, fontWeight: '700', fontSize: 12 },
  validValue: { color: '#FFFFFF', fontWeight: '900' },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4, paddingHorizontal: 4 },
  emptyText: { color: '#79747E', marginTop: 40, textAlign: 'center' },
});

export default CardsSection;

