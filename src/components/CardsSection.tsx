import React, { useState, useRef, useEffect } from 'react';
import {
  Image, ScrollView, StyleSheet, View, TouchableOpacity,
  useWindowDimensions, LayoutAnimation, PanResponder, Animated,
  UIManager, Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Button, Text, useTheme, Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { findBankByName } from '../constants/banks';
import { CardEntry } from '../types';
import { getCardColors } from '../constants/cardColors';
import { useUiStore } from '../store/useUiStore';
import { useWalletStore } from '../store/useWalletStore';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
const BankCard: React.FC<{
  card: CardEntry;
  cardWidth: number;
  totalDue: number;
  onPress: () => void;
  onLongPressCard?: (evt: any) => void;
  onPressOutCard?: () => void;
}> = ({ card, cardWidth, totalDue, onPress, onLongPressCard, onPressOutCard }) => {
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
        onLongPress={onLongPressCard}
        onPressOut={onPressOutCard}
        delayLongPress={450}
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

            {/* MIDDLE: chip + due amount */}
            <View style={styles.cardMiddle}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <GoldChip />
                <View style={styles.cardTypeLabel}>
                  <Text style={[styles.cardTypeLabelText, { fontSize: Math.round(cardWidth * 0.026) }]}>
                    {card.type?.toUpperCase() ?? 'DEBIT'} CARD
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.cardLabel, { fontSize: Math.round(cardWidth * 0.02), marginBottom: -2 }]}>DUE AMOUNT</Text>
                <Text style={{ color: '#FFFFFF', fontSize: Math.round(cardWidth * 0.045), fontWeight: '900', fontFamily: 'SpaceGrotesk', letterSpacing: 0.5, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
                  ₹ {totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
  const navigation = useNavigation<any>();
  const { width: screenW } = useWindowDimensions();
  const userName = useUiStore(s => s.userName);
  const userImage = useUiStore(s => s.userImage);
  const transactions = useWalletStore(s => s.transactions);
  const reorderCards = useWalletStore(s => s.reorderCards);
  const initials = userName ? userName.charAt(0).toUpperCase() : '?';
  const cardWidth = Math.min(screenW - 32, 420);

  // ── Drag state (React state for re-renders) ────────────────────
  const [localCards, setLocalCards] = useState<CardEntry[]>(cards);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // ── Refs — used inside PanResponder callbacks to avoid stale closures ──
  const localCardsRef = useRef<CardEntry[]>(cards);
  const draggingIndexRef = useRef<number | null>(null);
  const hoverIndexRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragCommencedRef = useRef(false);
  const dragActivationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPageYRef = useRef(0);
  const touchStartScrollRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  // Animated value for real-time card translation while dragging
  const dragTranslateY = useRef(new Animated.Value(0)).current;

  // Keep localCardsRef in sync with state
  useEffect(() => { localCardsRef.current = localCards; }, [localCards]);

  // Sync when a card is added / deleted externally
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalCards(cards);
      localCardsRef.current = cards;
    }
  }, [cards]);

  // card face + action row (marginTop 16 + buttons ~48) + cardBlock marginBottom (24)
  const ITEM_HEIGHT = Math.round(cardWidth * (240 / 380)) + 88;


  // ── finish-drag ref so PanResponder callbacks are never stale ──
  const finishDragRef = useRef<() => void>(() => {});
  useEffect(() => {
    finishDragRef.current = () => {
      // Reset translation BEFORE state updates so there's no positional flash on drop
      dragTranslateY.setValue(0);
      isDraggingRef.current = false;
      const from = draggingIndexRef.current;
      const to   = hoverIndexRef.current;
      if (from !== null && to !== null && from !== to) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const newCards = [...localCardsRef.current];
        const [moved] = newCards.splice(from, 1);
        newCards.splice(to, 0, moved);
        localCardsRef.current = newCards;
        setLocalCards([...newCards]);
        reorderCards(newCards.map(c => c.id));
      }
      draggingIndexRef.current = null;
      hoverIndexRef.current    = null;
      setDraggingIndex(null);
      setHoverIndex(null);
    };
  }, [reorderCards]);

  // ── Single PanResponder on the list container ────────────────
  // Only claims the responder when drag mode is already active (after long-press).
  // This way all normal card taps/buttons keep working.
  const listPR = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:        () => false,
      onStartShouldSetPanResponderCapture: () => false,
      // Steal responder on first move after long-press fires
      onMoveShouldSetPanResponder:         () => isDraggingRef.current,
      onMoveShouldSetPanResponderCapture:  () => isDraggingRef.current,
      onPanResponderTerminationRequest:    () => false,

      onPanResponderGrant: () => {
        // PanResponder has claimed the gesture — drag is truly underway
        if (dragActivationTimerRef.current) {
          clearTimeout(dragActivationTimerRef.current);
          dragActivationTimerRef.current = null;
        }
        dragCommencedRef.current = true;
        // touchStartPageYRef was already set in onLongPressCard
        touchStartScrollRef.current = scrollOffsetRef.current;
      },

      onPanResponderMove: (evt) => {
        if (!isDraggingRef.current) return;
        const screenDy = evt.nativeEvent.pageY - touchStartPageYRef.current;
        const scrollDy = scrollOffsetRef.current - touchStartScrollRef.current;
        const dy = screenDy + scrollDy;
        // Update the card's visual position in real-time (1:1 with finger)
        dragTranslateY.setValue(dy);
        // Update the hover-slot indicator
        const from   = draggingIndexRef.current ?? 0;
        const maxIdx = localCardsRef.current.length - 1;
        const newIdx = Math.max(0, Math.min(from + Math.round(dy / ITEM_HEIGHT), maxIdx));
        if (newIdx !== hoverIndexRef.current) {
          hoverIndexRef.current = newIdx;
          setHoverIndex(newIdx);
        }
      },

      onPanResponderRelease: () => finishDragRef.current(),

      onPanResponderTerminate: () => {
        dragTranslateY.setValue(0);
        isDraggingRef.current    = false;
        dragCommencedRef.current = false;
        draggingIndexRef.current = null;
        hoverIndexRef.current    = null;
        setDraggingIndex(null);
        setHoverIndex(null);
      },
    })
  ).current;

  // Helper: activate drag from the card's onLongPress
  const activateDrag = (index: number, pageY: number) => {
    dragTranslateY.setValue(0);      // start from zero relative to card's resting position
    isDraggingRef.current    = true;
    dragCommencedRef.current = false;
    draggingIndexRef.current = index;
    hoverIndexRef.current    = index;
    touchStartPageYRef.current  = pageY;
    touchStartScrollRef.current = scrollOffsetRef.current;
    setDraggingIndex(index);
    setHoverIndex(index);
    // Safety: auto-cancel if no finger movement starts within 600 ms
    if (dragActivationTimerRef.current) clearTimeout(dragActivationTimerRef.current);
    dragActivationTimerRef.current = setTimeout(() => {
      if (isDraggingRef.current && !dragCommencedRef.current) {
        isDraggingRef.current    = false;
        draggingIndexRef.current = null;
        hoverIndexRef.current    = null;
        setDraggingIndex(null);
        setHoverIndex(null);
      }
    }, 600);
  };

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
      </View>

      <View style={{ flex: 1 }} {...listPR.panHandlers}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={e => { scrollOffsetRef.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
      >
        {localCards.map((card, index) => {
          const cardTxs  = transactions.filter(t => t.cardId === card.id);
          const totalDue = cardTxs.reduce((s, t) => t.type === 'debit' ? s + t.amount : s - t.amount, 0);
          const isDragging = draggingIndex === index;

          const showLineBefore = (
            hoverIndex === index && draggingIndex !== null &&
            draggingIndex !== index && draggingIndex > index
          );
          const showLineAfter = (
            hoverIndex === index && draggingIndex !== null &&
            draggingIndex !== index && draggingIndex < index
          );

          return (
            <React.Fragment key={card.id}>
              {showLineBefore && (
                <View style={[styles.insertionLine, { width: cardWidth }]}>
                  <View style={styles.insertionDot} />
                  <View style={styles.insertionBar} />
                  <View style={styles.insertionDot} />
                </View>
              )}

              <Animated.View
                style={isDragging ? [
                  styles.cardLifted,
                  { transform: [{ translateY: dragTranslateY }] },
                ] : undefined}
              >
                <BankCard
                  card={card}
                  cardWidth={cardWidth}
                  totalDue={totalDue}
                  onPress={() => onCardPress(card)}
                  onLongPressCard={(evt) => activateDrag(index, evt.nativeEvent.pageY)}
                  onPressOutCard={() => {
                    // If drag was activated but finger lifted before any movement, cancel
                    if (isDraggingRef.current && !dragCommencedRef.current) {
                      setTimeout(() => {
                        if (isDraggingRef.current && !dragCommencedRef.current) {
                          isDraggingRef.current    = false;
                          draggingIndexRef.current = null;
                          hoverIndexRef.current    = null;
                          setDraggingIndex(null);
                          setHoverIndex(null);
                        }
                      }, 80);
                    }
                  }}
                />
              </Animated.View>

              {showLineAfter && (
                <View style={[styles.insertionLine, { width: cardWidth }]}>
                  <View style={styles.insertionDot} />
                  <View style={styles.insertionBar} />
                  <View style={styles.insertionDot} />
                </View>
              )}
            </React.Fragment>
          );
        })}

        {/* Add-card button */}
        <View style={styles.cardBlock}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SetupCards')}
            style={[styles.cardFace, {
              width: cardWidth,
              height: Math.round(cardWidth * (240 / 380)),
              borderRadius: 20,
              backgroundColor: theme.dark ? '#2A2A2A' : '#FFFFFF',
              justifyContent: 'center',
              alignItems: 'center',
              shadowOpacity: 0,
              elevation: 0,
              borderTopWidth: 0,
              borderLeftWidth: 0,
            }]}
          >
            <Avatar.Icon size={64} icon="plus" style={{ backgroundColor: 'transparent' }} color={theme.colors.onSurfaceVariant} />
            <Text style={{ marginTop: 8, color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk', fontWeight: '600' }}>Add new card</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </View>
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
  cardBlock: { marginBottom: 24, alignItems: 'center' },
  // Lifted appearance while dragging — no opacity fade, card stays fully visible
  cardLifted: {
    zIndex: 10,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
  },
  // ── Insertion line shown at the drop-target position ──────────
  insertionLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  insertionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366f1',
  },
  insertionBar: {
    flex: 1,
    height: 3,
    backgroundColor: '#6366f1',
    marginHorizontal: 4,
    borderRadius: 2,
  },
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
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cardTypeLabelText: {
    color: '#FFFFFF',
    fontFamily: 'SpaceGrotesk',
    fontWeight: '800',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  holderBlock: { flex: 2, paddingRight: 8 },
  expiryBlock: { flex: 1, paddingRight: 8 },
  networkBlock: { flex: 1, alignItems: 'flex-end' },
  cardLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'SpaceGrotesk',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardValue: {
    color: '#FFFFFF',
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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

  // Empty handled by component
});

export default CardsSection;
