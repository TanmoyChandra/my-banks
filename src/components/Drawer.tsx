import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Avatar, useTheme, IconButton, Surface } from 'react-native-paper';
import Modal from 'react-native-modal';
import { DrawerScreen } from '../types';

const { width } = Dimensions.get('window');

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (screen: DrawerScreen) => void;
}

const DrawerPanel: React.FC<DrawerProps> = ({ open, onClose, onNavigate }) => {
  const theme = useTheme();

  return (
    <Modal
      isVisible={open}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="left"
      animationIn="slideInLeft"
      animationOut="slideOutLeft"
      animationInTiming={300}
      animationOutTiming={300}
      backdropTransitionInTiming={300}
      backdropTransitionOutTiming={300}
      backdropOpacity={0.5}
      useNativeDriver
      hideModalContentWhileAnimating
      style={styles.modal}
    >
      <View style={[styles.drawer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Avatar.Icon size={44} icon="bank" style={{ backgroundColor: theme.colors.primary }} color={theme.colors.onPrimary} />
            <View>
              <Text style={styles.headerSubtitle}>Configuration</Text>
              <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>My Banks</Text>
            </View>
          </View>
          <IconButton icon="close" size={24} iconColor={theme.colors.onSurface} onPress={onClose} />
        </View>

        <View style={styles.content}>
          <Surface style={[styles.menuItem, { backgroundColor: theme.colors.surface }]} elevation={0} onTouchEnd={() => onNavigate('setup-qr')}>
            <View style={[styles.iconBox, { backgroundColor: theme.colors.primary }]}>
              <IconButton icon="qrcode-scan" size={20} iconColor={theme.colors.onPrimary} style={{ margin: 0 }} />
            </View>
            <Text style={[styles.menuText, { color: theme.colors.onSurface }]}>Setup QR Code</Text>
          </Surface>
          
          <Surface style={[styles.menuItem, { backgroundColor: theme.colors.surface }]} elevation={0} onTouchEnd={() => onNavigate('setup-accounts')}>
            <View style={[styles.iconBox, { backgroundColor: theme.colors.primary }]}>
              <IconButton icon="bank" size={20} iconColor={theme.colors.onPrimary} style={{ margin: 0 }} />
            </View>
            <Text style={[styles.menuText, { color: theme.colors.onSurface }]}>Setup Bank Account</Text>
          </Surface>

          <Surface style={[styles.menuItem, { backgroundColor: theme.colors.surface }]} elevation={0} onTouchEnd={() => onNavigate('setup-cards')}>
            <View style={[styles.iconBox, { backgroundColor: theme.colors.primary }]}>
              <IconButton icon="credit-card" size={20} iconColor={theme.colors.onPrimary} style={{ margin: 0 }} />
            </View>
            <Text style={[styles.menuText, { color: theme.colors.onSurface }]}>Setup Debit/Credit Card</Text>
          </Surface>
        </View>

        <View style={[styles.footer, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>All data is stored locally on your device. No cloud, no backend.</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-start',
  },
  drawer: {
    width: '80%',
    height: '100%',
    borderTopRightRadius: 40,
    borderBottomRightRadius: 40,
    paddingTop: 64,
    paddingHorizontal: 24,
    elevation: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#71717a',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  content: {
    flex: 1,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    gap: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '900',
  },
  footer: {
    padding: 16,
    borderRadius: 24,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 24,
  },
});

export default DrawerPanel;
