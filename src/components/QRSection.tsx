import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Clipboard } from 'react-native';
import { Card, Text, IconButton, Button, Avatar, useTheme, Divider, List } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { QREntry } from '../types';
import EmptyState from './EmptyState';
import { BANKS } from '../constants/banks';

interface QRSectionProps {
  entries: QREntry[];
  onSetup: () => void;
}

const QRCard: React.FC<{ entry: QREntry }> = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();

  const handleCopy = (text: string) => {
    Clipboard.setString(text);
  };

  const bankData = BANKS.find(b => b.name === entry.bankName);
  const title = entry.name || entry.bankName || entry.upiId || 'QR Entry';
  
  // Construct UPI Deep Link
  const upiLink = entry.qrValue || `upi://pay?pa=${entry.upiId}&pn=${encodeURIComponent(entry.name || entry.bankName)}&cu=INR`;

  return (
    <Card style={styles.card} mode="elevated">
      <Card.Title
        title={title}
        subtitle={entry.bankName || entry.upiId}
        titleStyle={{ color: 'white', fontWeight: '700' }}
        subtitleStyle={{ color: 'rgba(255,255,255,0.8)' }}
        style={[styles.cardHeader, { backgroundColor: theme.colors.primary }]}
        left={(props) => (
          bankData ? (
            <Avatar.Image
              {...props}
              size={40}
              source={{ uri: bankData.logo }}
              style={{ backgroundColor: 'white' }}
            />
          ) : (
            <Avatar.Text
              {...props}
              size={40}
              label={title.substring(0, 2).toUpperCase()}
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              color="white"
            />
          )
        )}
      />
      <Card.Content style={styles.cardContent}>
        {entry.name ? (
          <List.Item
            title="Name"
            description={entry.name}
            right={() => (
              <Button mode="text" onPress={() => handleCopy(entry.name)} compact>
                Copy
              </Button>
            )}
          />
        ) : null}
        {entry.bankName ? (
          <List.Item title="Bank" description={entry.bankName} />
        ) : null}
        <List.Item
          title="UPI ID"
          description={entry.upiId || 'Not found'}
          right={() => entry.upiId ? (
            <Button mode="text" onPress={() => handleCopy(entry.upiId)} compact>
              Copy
            </Button>
          ) : null}
        />
        
        {expanded && (
          <View style={styles.expanded}>
            <Divider style={styles.divider} />
            
            {/* Generated QR Code */}
            <View style={styles.qrContainer}>
              <Text variant="labelMedium" style={styles.qrLabel}>SCAN TO PAY</Text>
              <View style={styles.qrFrame}>
                <QRCode
                  value={upiLink}
                  size={180}
                  color={theme.colors.onSurface}
                  backgroundColor={theme.colors.surface}
                />
              </View>
              <Text variant="bodySmall" style={styles.qrFooter}>Secure UPI Payment</Text>
            </View>

            <Divider style={styles.divider} />
            
            <List.Item
              title="QR Value"
              description={entry.qrValue || 'Not provided'}
              descriptionNumberOfLines={3}
              right={() => entry.qrValue ? (
                <Button mode="text" onPress={() => handleCopy(entry.qrValue)} compact>
                  Copy
                </Button>
              ) : null}
            />
            <List.Item
              title="Mobile"
              description={entry.mobileNumber || '—'}
              right={() => entry.mobileNumber ? (
                <Button mode="text" onPress={() => handleCopy(entry.mobileNumber)} compact>
                  Copy
                </Button>
              ) : null}
            />
            <List.Item
              title="Bank Address"
              description={entry.address || 'Not provided'}
              descriptionNumberOfLines={3}
            />
            {entry.notes ? (
              <View style={styles.notesBox}>
                <Text variant="labelSmall" style={{ color: theme.colors.primary }}>NOTES</Text>
                <Text variant="bodySmall">{entry.notes}</Text>
              </View>
            ) : null}
          </View>
        )}
      </Card.Content>
      <Card.Actions>
        <Button 
          onPress={() => setExpanded(!expanded)}
          icon={expanded ? "chevron-up" : "chevron-down"}
        >
          {expanded ? "Hide QR Code" : "Show QR Code"}
        </Button>
      </Card.Actions>
    </Card>
  );
};

const QRSection: React.FC<QRSectionProps> = ({ entries, onSetup }) => {
  const theme = useTheme();

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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text variant="labelLarge" style={[styles.countLabel, { color: theme.colors.primary }]}>
        {entries.length} {entries.length === 1 ? 'ENTRY' : 'ENTRIES'}
      </Text>
      {entries.map((entry) => (
        <QRCard key={entry.id} entry={entry} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  countLabel: {
    marginBottom: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  cardContent: {
    paddingHorizontal: 8,
  },
  expanded: {
    marginTop: 8,
    alignItems: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    width: '100%',
  },
  qrLabel: {
    marginBottom: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#6750A4',
  },
  qrFrame: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  qrFooter: {
    marginTop: 12,
    color: '#79747E',
  },
  divider: {
    marginVertical: 8,
    width: '100%',
  },
  notesBox: {
    backgroundColor: '#F3EDF7',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    width: '90%',
  },
});

export default QRSection;
