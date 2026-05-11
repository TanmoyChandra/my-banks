import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, View, TouchableOpacity, useWindowDimensions } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Button, Text, useTheme, Avatar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { findBankByName } from '../constants/banks';
import { CardEntry } from '../types';
import { getCardColors } from '../constants/cardColors';
import { useUiStore } from '../store/useUiStore';

// Network logo PNGs
const VISA_PNG       = require('../../assets/Visa.png');
const MASTERCARD_PNG = require('../../assets/mastercard.png');
const RUPAY_PNG      = require('../../assets/rupay.png');
const TAPTOPAY_PNG   = require('../../assets/taptopay.png');

interface CardsSectionProps {
  cards: CardEntry[];
  onCardPress?: (card: CardEntry) => void;
}

// ── Helpers ───────────────────────────────────────────────────
const formatCardNumber = (num: string) => {
  const clean = num.replace(/\D/g, '').slice(0, 16);
  if (!clean) return '0000  ••••  ••••  0000';
  return clean.replace(/(.{4})/g, '$1  ').trim();
};

const maskCardNumber = (num: string) => {
  const clean = num.replace(/\D/g, '').slice(0, 16);
  const first = clean.slice(0, 4) || '0000';
  const last  = clean.slice(-4)  || '0000';
  return `${first}  ••••  ••••  ${last}`;
};

function getNetwork(card: CardEntry): 'Visa' | 'Mastercard' | 'RuPay' {
  // Use explicitly chosen network first
  if (card.network) return card.network;
  // Fallback: auto-detect from card number
  const clean = card.cardNumber.replace(/\D/g, '');
  if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'Mastercard';
  if (/^6(?:0|5|22|52|53)/.test(clean)) return 'RuPay';
  return 'Visa';
}

// ── Contactless SVG ───────────────────────────────────────────
function ContactlessIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path d="M12 1C7.03 1 3 5.03 3 10c0 2.76 1.12 5.26 2.93 7.07" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
      <Path d="M12 5c-2.76 0-5 2.24-5 5 0 1.38.56 2.63 1.46 3.54" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
      <Circle cx={12} cy={10} r={1} fill="#fff" />
      <Path d="M16.54 6.46C17.44 7.37 18 8.62 18 10c0 2.76-2.24 5-5 5" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
      <Path d="M20.07 2.93C21.88 4.74 23 7.24 23 10c0 5.52-4.48 10-10 10" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

// ── EMV Chip (View-based, reliable gold gradient) ────────────
function GoldChip() {
  return (
    <LinearGradient
      colors={['#d4af37', '#f5d060', '#b8860b', '#f0c040', '#c8962c']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={chipStyles.body}
    >
      {/* Horizontal contact lines */}
      <View style={chipStyles.linesWrap}>
        <View style={chipStyles.line} />
        <View style={chipStyles.line} />
        <View style={chipStyles.line} />
      </View>
      {/* Vertical dividers */}
      <View style={[chipStyles.vLine, { left: '33%' }]} />
      <View style={[chipStyles.vLine, { left: '66%' }]} />
      {/* Centre contact pad */}
      <LinearGradient
        colors={['#e8c84a', '#c8962c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={chipStyles.pad}
      />
      {/* Top-left shine */}
      <View style={chipStyles.shine} />
    </LinearGradient>
  );
}

const chipStyles = StyleSheet.create({
  body: {
    width: 46,
    height: 36,
    borderRadius: 7,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  linesWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'space-evenly',
    paddingVertical: 6,
  },
  line: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginHorizontal: 4,
  },
  vLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  pad: {
    position: 'absolute',
    width: 20,
    height: 22,
    borderRadius: 3,
    top: '50%',
    left: '50%',
    marginTop: -11,
    marginLeft: -10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 22,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderBottomRightRadius: 14,
  },
});

// ── Network logos (PNG images) ────────────────────────────────
function VisaLogo({ size }: { size: number }) {
  return <Image source={VISA_PNG} style={{ width: size * 1.8, height: size, marginBottom: -5 }} resizeMode="contain" />;
}

function MastercardLogo({ size }: { size: number }) {
  return <Image source={MASTERCARD_PNG} style={{ width: size * 1.6, height: size }} resizeMode="contain" />;
}

function RuPayLogo({ size }: { size: number }) {
  return <Image source={RUPAY_PNG} style={{ width: size * 2.2, height: size, marginBottom: -8 }} resizeMode="contain" />;
}

// ── BankCard ─────────────────────────────────────────────────
const BankCard: React.FC<{ card: CardEntry; cardWidth: number; onPress: () => void }> = ({ card, cardWidth, onPress }) => {
  const [showFull, setShowFull] = useState(false);
  const palette = getCardColors(card.color);
  const network = getNetwork(card);
  const bank = findBankByName(card.bankName);
  const cardHeight = Math.round(cardWidth * (240 / 380));

  const displayNumber = showFull
    ? formatCardNumber(card.cardNumber)
    : maskCardNumber(card.cardNumber);

  const copy = async (val: string) => {
    await Clipboard.setStringAsync(val.replace(/\s/g, ''));
  };

  return (
    <View style={styles.cardBlock}>
      {/* ── Card face ── */}
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => setShowFull(v => !v)}
        style={[styles.cardFace, { width: cardWidth, height: cardHeight, borderRadius: 20 }]}
      >
        <LinearGradient
          colors={[palette.from, palette.via, palette.to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        >
          {/* Circuit grid pattern (subtle) */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
              {[0.3, 0.5, 0.7].map((r, i) => (
                <Path
                  key={`h${i}`}
                  d={`M0 ${cardHeight * r} L${cardWidth} ${cardHeight * r}`}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth={1}
                />
              ))}
              {[0.25, 0.5, 0.75].map((r, i) => (
                <Path
                  key={`v${i}`}
                  d={`M${cardWidth * r} 0 L${cardWidth * r} ${cardHeight}`}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth={1}
                />
              ))}
            </Svg>
          </View>

          {/* Glow blobs */}
          <View style={[styles.glow1, { backgroundColor: palette.glow1 }]} pointerEvents="none" />
          <View style={[styles.glow2, { backgroundColor: palette.glow2 }]} pointerEvents="none" />

          {/* Holographic shimmer overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.07)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.07)', 'transparent']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* ── Card content ── */}
          <View style={[styles.cardContent, { padding: Math.round(cardWidth * 0.06) }]}>

            {/* TOP: bank logo + name + contactless */}
            <View style={styles.cardTop}>
              <View style={styles.bankLogoRow}>
                {bank ? (
                  <Image source={bank.symbol} style={styles.bankLogoImg} resizeMode="contain" />
                ) : null}
                <Text style={[styles.bankName, { fontSize: Math.round(cardWidth * 0.038) }]}>
                  {card.bankName.toUpperCase()}
                </Text>
              </View>
              <View style={styles.contactless}>
                <Image source={TAPTOPAY_PNG} style={styles.tapToPayImg} resizeMode="contain" />
              </View>
            </View>

            {/* MIDDLE: chip + card type label */}
            <View style={styles.cardMiddle}>
              <GoldChip />
              <View style={styles.cardTypeLabel}>
                <Text style={[styles.cardTypeLabelText, { fontSize: Math.round(cardWidth * 0.026) }]}>
                  {card.type?.toUpperCase() ?? 'DEBIT'} CARD
                </Text>
              </View>
            </View>

            {/* CARD NUMBER + COPY */}
            <View style={styles.rowAlignCenter}>
              <Text style={[styles.cardNumber, { fontSize: Math.round(cardWidth * 0.058), letterSpacing: Math.round(cardWidth * 0.012) }]}>
                {displayNumber}
              </Text>
              <TouchableOpacity onPress={() => copy(card.cardNumber)} style={styles.inlineCopy}>
                <Avatar.Icon size={Math.round(cardWidth * 0.055)} icon="content-copy" color="rgba(255,255,255,0.6)" style={{ backgroundColor: 'transparent' }} />
              </TouchableOpacity>
            </View>

            {/* BOTTOM: holder + expiry + network logo */}
            <View style={styles.cardBottom}>
              <View style={styles.holderBlock}>
                <Text style={[styles.cardLabel, { fontSize: Math.round(cardWidth * 0.023) }]}>Card Holder</Text>
                <View style={styles.rowAlignCenter}>
                  <Text style={[styles.cardValue, { fontSize: Math.round(cardWidth * 0.034) }]} numberOfLines={1}>
                    {(card.holderName || 'CARD HOLDER').toUpperCase()}
                  </Text>
                  <TouchableOpacity onPress={() => copy(card.holderName || '')} style={styles.inlineCopy}>
                    <Avatar.Icon size={Math.round(cardWidth * 0.045)} icon="content-copy" color="rgba(255,255,255,0.4)" style={{ backgroundColor: 'transparent' }} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.expiryBlock}>
                <Text style={[styles.cardLabel, { fontSize: Math.round(cardWidth * 0.023) }]}>Expires</Text>
                <View style={styles.rowAlignCenter}>
                  <Text style={[styles.cardValue, { fontSize: Math.round(cardWidth * 0.034) }]}>
                    {card.expiry || 'MM/YY'}
                  </Text>
                  <TouchableOpacity onPress={() => copy(card.expiry || '')} style={styles.inlineCopy}>
                    <Avatar.Icon size={Math.round(cardWidth * 0.045)} icon="content-copy" color="rgba(255,255,255,0.4)" style={{ backgroundColor: 'transparent' }} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.networkBlock}>
                {network === 'Visa'       ? <VisaLogo       size={Math.round(cardWidth * 0.09)} /> : null}
                {network === 'Mastercard' ? <MastercardLogo size={Math.round(cardWidth * 0.09)} /> : null}
                {network === 'RuPay'      ? <RuPayLogo      size={Math.round(cardWidth * 0.09)} /> : null}
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Action Buttons Row */}
      <View style={[styles.cardActionsRow, { width: cardWidth }]}>
        <Button
          mode="contained-tonal"
          onPress={() => copy(card.cvv || '')}
          style={styles.copyCvvBtn}
          labelStyle={styles.actionBtnLabel}
          icon="content-copy"
        >
          CVV
        </Button>
        <Button
          mode="contained-tonal"
          onPress={onPress}
          style={styles.seeTransactionsBtn}
          labelStyle={styles.actionBtnLabel}
          icon="history"
        >
          Transactions
        </Button>
      </View>
    </View>
  );
};

// ── Section ───────────────────────────────────────────────────
const CardsSection: React.FC<CardsSectionProps> = ({ cards, onCardPress = () => {} }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const userName = useUiStore(s => s.userName);
  const initials = userName ? userName.charAt(0).toUpperCase() : '?';
  const cardWidth = Math.min(screenW - 32, 420);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.sectionIntro}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={[styles.introTitle, { color: theme.colors.onSurface }]}>Payment cards</Text>
            <Text style={[styles.introText, { color: theme.dark ? '#a1a1aa' : '#52525b' }]}>
              Manage your payment cards and view transactions.
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
            <Avatar.Icon size={64} icon="credit-card-outline"
              style={{ backgroundColor: theme.colors.surfaceVariant, marginBottom: 16 }}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>No cards yet</Text>
            <Text style={[styles.emptySubText, { color: theme.colors.onSurfaceVariant }]}>
              Open the menu to add your first card
            </Text>
          </View>
        ) : (
          cards.map(card => (
            <BankCard
              key={card.id}
              card={card}
              cardWidth={cardWidth}
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
  scrollContent: { paddingHorizontal: 16, paddingBottom: 96 },

  // ── Card block ───────────────────────────────────────────────
  cardBlock: { marginBottom: 32, alignItems: 'center' },
  cardFace: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.08)',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Ambient glows
  glow1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -80,
    right: -50,
    opacity: 0.18,
    // blur equivalent via shadow won't work well — just colour glow
  },
  glow2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: -70,
    left: -40,
    opacity: 0.12,
  },

  // TOP row
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bankLogoImg: { width: 28, height: 28 },
  bankName: {
    color: '#FFFFFF',
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  contactless: { opacity: 0.9 },
  tapToPayImg: { width: 24, height: 24 },

  // MIDDLE row
  cardMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  cardTypeLabel: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  cardTypeLabelText: {
    color: 'rgba(255,255,255,0.55)',
    fontFamily: 'SpaceGrotesk',
    fontWeight: '600',
    letterSpacing: 2,
  },

  // CARD NUMBER
  cardNumber: {
    color: '#FFFFFF',
    fontFamily: 'SpaceGrotesk',
    fontWeight: '400',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  // BOTTOM row
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  rowAlignCenter: { flexDirection: 'row', alignItems: 'center' },
  inlineCopy: { marginLeft: 6, opacity: 0.8 },

  cardActionsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  seeTransactionsBtn: {
    flex: 2,
    borderRadius: 12,
  },
  copyCvvBtn: {
    flex: 1,
    borderRadius: 12,
  },
  actionBtnLabel: {
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    fontSize: 13,
    paddingVertical: 2,
  },

  // Empty
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyText: { fontSize: 22, fontWeight: '900', fontFamily: 'SpaceGrotesk', marginBottom: 8 },
  emptySubText: { fontSize: 14, fontFamily: 'SpaceGrotesk', textAlign: 'center', paddingHorizontal: 40 },
});

export default CardsSection;
