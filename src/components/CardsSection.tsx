import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Clipboard } from 'react-native';
import { Card, Text, Button, IconButton, useTheme, SegmentedButtons, Avatar } from 'react-native-paper';
import { CardEntry } from '../types';
import EmptyState from './EmptyState';

interface CardsSectionProps {
  cards: CardEntry[];
  onSetup: () => void;
}

const BankCard: React.FC<{ card: CardEntry }> = ({ card }) => {
  const [revealed, setRevealed] = useState(false);
  const theme = useTheme();

  const getCardColor = (bankName: string): string => {
    const name = bankName.toLowerCase();
    if (name.includes('sbi') || name.includes('state bank')) return '#1565C0';
    if (name.includes('hdfc')) return '#004C97';
    if (name.includes('icici')) return '#B71C1C';
    if (name.includes('axis')) return '#37474F';
    return card.type === 'Credit' ? '#6750A4' : '#455A64';
  };

  const maskCardNumber = (num: string) => {
    const clean = num.replace(/\D/g, '');
    if (clean.length < 4) return num;
    return `•••• •••• •••• ${clean.slice(-4)}`;
  };

  const handleCopy = () => {
    Clipboard.setString(card.cardNumber.replace(/\D/g, ''));
  };

  const cardColor = getCardColor(card.bankName);

  return (
    <Card style={[styles.bankCard, { backgroundColor: cardColor }]} mode="elevated">
      <View style={styles.cardHeader}>
        <View>
          <Text variant="labelSmall" style={styles.cardBankName}>{card.bankName.toUpperCase()}</Text>
          {card.nickname ? <Text variant="titleMedium" style={styles.cardNickname}>{card.nickname}</Text> : null}
        </View>
        <View style={styles.badge}>
          <Text variant="labelSmall" style={styles.badgeText}>{card.type.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <IconButton icon="integrated-circuit-chip" iconColor="#F0D060" size={32} style={styles.chip} />
        
        <View style={styles.numberRow}>
          <Text variant="headlineSmall" style={styles.cardNumber}>
            {revealed ? card.cardNumber : maskCardNumber(card.cardNumber)}
          </Text>
          <View style={styles.actions}>
            <IconButton 
              icon={revealed ? "eye-off" : "eye"} 
              iconColor="white" 
              size={20} 
              onPress={() => setRevealed(!revealed)} 
            />
            <Button mode="outlined" textColor="white" onPress={handleCopy} style={styles.copyBtn} compact labelStyle={{ fontSize: 10 }}>
              Copy
            </Button>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text variant="labelSmall" style={styles.footerLabel}>CARD HOLDER</Text>
          <Text variant="bodyMedium" style={styles.footerValue}>{card.holderName.toUpperCase()}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="labelSmall" style={styles.footerLabel}>EXPIRES</Text>
          <Text variant="bodyMedium" style={styles.footerValue}>{card.expiry}</Text>
        </View>
      </View>
    </Card>
  );
};

const CardsSection: React.FC<CardsSectionProps> = ({ cards, onSetup }) => {
  const [filter, setFilter] = useState('All');
  const theme = useTheme();

  const filtered = filter === 'All' ? cards : cards.filter(c => c.type === filter);

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
      <View style={styles.filterBar}>
        <SegmentedButtons
          value={filter}
          onValueChange={setFilter}
          buttons={[
            { value: 'All', label: 'All' },
            { value: 'Credit', label: 'Credit' },
            { value: 'Debit', label: 'Debit' },
          ]}
          style={styles.segmented}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>No {filter.toLowerCase()} cards found.</Text>
        ) : (
          filtered.map((card) => <BankCard key={card.id} card={card} />)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBar: {
    padding: 16,
  },
  segmented: {
    paddingHorizontal: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  bankCard: {
    height: 200,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardBankName: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
  },
  cardNickname: {
    color: 'white',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    color: 'white',
    fontWeight: '800',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  chip: {
    margin: 0,
    marginLeft: -8,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardNumber: {
    color: 'white',
    letterSpacing: 2,
    fontFamily: 'System', // Bold system font
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyBtn: {
    borderColor: 'rgba(255,255,255,0.5)',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
  },
  footerValue: {
    color: 'white',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#79747E',
  },
});

export default CardsSection;
