import React, { useState } from 'react';
import { Clipboard, Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';
import { findBankByName } from '../constants/banks';
import { CardEntry } from '../types';
import EmptyState from './EmptyState';

interface CardsSectionProps {
  cards: CardEntry[];
  onSetup: () => void;
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
  <Svg pointerEvents="none" style={StyleSheet.absoluteFill} viewBox="0 0 360 228" preserveAspectRatio="none">
    {Array.from({ length: 18 }).map((_, index) => {
      const y = 18 + index * 11;
      const bend = index % 2 === 0 ? 26 : -18;
      return (
        <Path
          key={index}
          d={`M-20 ${y} C 62 ${y + bend}, 118 ${y - bend}, 190 ${y} S 308 ${y + bend}, 386 ${y - 4}`}
          stroke="rgba(255,255,255,0.055)"
          strokeWidth="2"
          fill="none"
        />
      );
    })}
    <Path
      d="M-30 212 C 68 138, 144 136, 212 170 S 324 212, 390 130"
      stroke="rgba(255,255,255,0.06)"
      strokeWidth="18"
      fill="none"
    />
  </Svg>
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

const BankCard: React.FC<{ card: CardEntry }> = ({ card }) => {
  const network = networkName(card);
  const [showCvv, setShowCvv] = useState(false);

  return (
    <View style={styles.cardBlock}>
      <View style={styles.cardFace}>
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
        <Button compact mode="text" icon="content-copy" labelStyle={{ fontSize: 12 }} onPress={() => Clipboard.setString(card.holderName || '')}>
          Name
        </Button>
        <Button compact mode="text" icon="content-copy" labelStyle={{ fontSize: 12 }} onPress={() => Clipboard.setString(card.cardNumber.replace(/\D/g, ''))}>
          Number
        </Button>
        <Button compact mode="text" icon="content-copy" labelStyle={{ fontSize: 12 }} onPress={() => Clipboard.setString(card.expiry || '')}>
          Date
        </Button>
        <Button compact mode="text" icon="content-copy" labelStyle={{ fontSize: 12 }} onPress={() => Clipboard.setString(card.cvv || '')}>
          CVV
        </Button>
      </View>
    </View>
  );
};

const CardsSection: React.FC<CardsSectionProps> = ({ cards, onSetup }) => {
  const theme = useTheme();

  if (cards.length === 0) {
    return (
      <EmptyState
        icon={<IconButton icon="card-bulleted" size={48} iconColor={theme.colors.primary} />}
        title="No Cards Saved"
        description="Save your credit and debit card details for quick access. Card numbers are masked by default for security."
        actionLabel="Add a Card"
        onAction={onSetup}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text variant="labelLarge" style={styles.countLabel}>
          {cards.length} {cards.length === 1 ? 'CARD' : 'CARDS'}
        </Text>
        <Button mode="text" icon="plus" onPress={onSetup} textColor={theme.colors.primary}>
          Add
        </Button>
      </View>



      <ScrollView contentContainerStyle={styles.scrollContent}>
        {cards.length === 0 ? (
          <Text style={styles.emptyText}>No cards found.</Text>
        ) : (
          cards.map(card => <BankCard key={card.id} card={card} />)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 16 },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  countLabel: { color: '#6750A4', fontWeight: '700' },

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
  networkLabel: { color: '#F6F6F6', flex: 1, fontWeight: '500', marginLeft: 8 },
  rupayText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
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
  cardHolderName: { color: '#FFFFFF', fontWeight: '400', letterSpacing: 1.4, marginBottom: 8 },
  cardNumber: { color: '#FFFFFF', fontWeight: '400', letterSpacing: 3 },
  bottomRow: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' },
  holderBlock: { flex: 1, marginRight: 16 },
  holderName: { color: '#FFFFFF', fontWeight: '400', letterSpacing: 2 },
  cardType: { color: '#D8D8D8', marginTop: 4 },
  validBlock: { alignItems: 'flex-start', minWidth: 78 },
  validLabel: { color: '#FFFFFF', marginTop: 14 },
  validValue: { color: '#FFFFFF', fontWeight: '500' },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4, paddingHorizontal: 4 },
  emptyText: { color: '#79747E', marginTop: 40, textAlign: 'center' },
});

export default CardsSection;

