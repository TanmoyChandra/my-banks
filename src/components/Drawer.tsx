import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Drawer, Modal, Portal, Text, Avatar, useTheme, Divider } from 'react-native-paper';
import { DrawerScreen } from '../types';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (screen: DrawerScreen) => void;
}

const DrawerPanel: React.FC<DrawerProps> = ({ open, onClose, onNavigate }) => {
  const theme = useTheme();

  return (
    <Portal>
      <Modal
        visible={open}
        onDismiss={onClose}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={[styles.drawer, { backgroundColor: theme.colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
            <Avatar.Icon size={56} icon="bank" style={styles.avatar} color={theme.colors.primary} />
            <Text variant="titleLarge" style={styles.headerTitle}>My Banks</Text>
            <Text variant="bodySmall" style={styles.headerSubtitle}>Personal Finance Manager</Text>
          </View>

          <View style={styles.content}>
            <Text variant="labelMedium" style={[styles.sectionLabel, { color: theme.colors.primary }]}>
              SETUP & CONFIGURATION
            </Text>

            <Drawer.Item
              label="Setup QR / UPI"
              icon="qrcode-scan"
              onPress={() => onNavigate('setup-qr')}
              style={styles.drawerItem}
            />
            <Drawer.Item
              label="Setup Debit/Credit Cards"
              icon="card-bulleted"
              onPress={() => onNavigate('setup-cards')}
              style={styles.drawerItem}
            />
            <Drawer.Item
              label="Setup Bank Accounts"
              icon="bank-transfer"
              onPress={() => onNavigate('setup-accounts')}
              style={styles.drawerItem}
            />
          </View>

          <Divider />
          
          <View style={styles.footer}>
            <Text variant="bodySmall" style={styles.footerText}>Data stored locally on device</Text>
            <Text variant="bodySmall" style={styles.footerText}>v1.0.0 — My Banks</Text>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 0,
    justifyContent: 'flex-start',
    height: '100%',
  },
  drawer: {
    width: '80%',
    height: '100%',
    elevation: 16,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatar: {
    backgroundColor: 'white',
    marginBottom: 12,
  },
  headerTitle: {
    color: 'white',
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  sectionLabel: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  drawerItem: {
    borderRadius: 0,
    marginVertical: 2,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#79747E',
    textAlign: 'center',
  },
});

export default DrawerPanel;
