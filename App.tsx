import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { 
  Provider as PaperProvider, 
  FAB, 
  Portal, 
  Modal, 
  Appbar,
  BottomNavigation,
  Text,
  MD3LightTheme
} from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TabType, DrawerScreen } from './src/types';
import { useStore } from './src/store';
import { theme } from './src/theme';

import QRSection from './src/components/QRSection';
import CardsSection from './src/components/CardsSection';
import BankAccountsSection from './src/components/BankAccountsSection';
import SetupQR from './src/components/setup/SetupQR';
import SetupCards from './src/components/setup/SetupCards';
import SetupAccounts from './src/components/setup/SetupAccounts';
import WelcomeBanner from './src/components/WelcomeBanner';
import DrawerPanel from './src/components/Drawer';

export default function App() {
  const [index, setIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<DrawerScreen>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  const {
    loaded,
    qrEntries, addQR, updateQR, deleteQR,
    cards, addCard, updateCard, deleteCard,
    accounts, addAccount, updateAccount, deleteAccount,
  } = useStore();

  useEffect(() => {
    const checkWelcome = async () => {
      const welcomed = await AsyncStorage.getItem('mybanks_welcomed');
      if (!welcomed) setShowWelcome(true);
    };
    checkWelcome();
  }, []);

  const routes = [
    { key: 'qr', title: 'UPI / QR', focusedIcon: 'qrcode-scan', unfocusedIcon: 'qrcode', badge: qrEntries.length || undefined },
    { key: 'cards', title: 'Cards', focusedIcon: 'card-bulleted', unfocusedIcon: 'card-bulleted-outline', badge: cards.length || undefined },
    { key: 'accounts', title: 'Accounts', focusedIcon: 'bank', unfocusedIcon: 'bank-outline', badge: accounts.length || undefined },
  ];

  const renderScene = BottomNavigation.SceneMap({
    qr: () => (
      <View style={styles.scene}>
        {showWelcome && qrEntries.length === 0 && (
          <WelcomeBanner onDismiss={async () => {
            setShowWelcome(false);
            await AsyncStorage.setItem('mybanks_welcomed', '1');
          }} />
        )}
        <QRSection entries={qrEntries} onSetup={() => setActiveScreen('setup-qr')} />
      </View>
    ),
    cards: () => <CardsSection cards={cards} onSetup={() => setActiveScreen('setup-cards')} />,
    accounts: () => <BankAccountsSection accounts={accounts} onSetup={() => setActiveScreen('setup-accounts')} />,
  });

  if (!loaded) return null;

  // Setup Screen Overlay
  if (activeScreen) {
    const screens = {
      'setup-qr': <SetupQR entries={qrEntries} onAdd={addQR} onUpdate={updateQR} onDelete={deleteQR} onBack={() => setActiveScreen(null)} />,
      'setup-cards': <SetupCards cards={cards} onAdd={addCard} onUpdate={updateCard} onDelete={deleteCard} onBack={() => setActiveScreen(null)} />,
      'setup-accounts': <SetupAccounts accounts={accounts} onAdd={addAccount} onUpdate={updateAccount} onDelete={deleteAccount} onBack={() => setActiveScreen(null)} />,
    };
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style="light" backgroundColor={theme.colors.primary} />
          {screens[activeScreen as keyof typeof screens]}
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="dark" backgroundColor={theme.colors.background} />
        <View style={styles.container}>
          <Appbar.Header elevated style={{ backgroundColor: theme.colors.primary }}>
            <Appbar.Action icon="menu" color="white" onPress={() => setDrawerOpen(true)} />
            <Appbar.Content title={routes[index].title} titleStyle={{ color: 'white' }} />
          </Appbar.Header>

          <BottomNavigation
            navigationState={{ index, routes }}
            onIndexChange={setIndex}
            renderScene={renderScene}
            barStyle={{ backgroundColor: theme.colors.surface }}
            activeColor={theme.colors.primary}
            theme={{ colors: { secondaryContainer: theme.colors.secondaryContainer } }}
          />

          <FAB
            icon="plus"
            style={styles.fab}
            color="white"
            onPress={() => {
              const tab = routes[index].key;
              setActiveScreen(tab === 'qr' ? 'setup-qr' : tab === 'cards' ? 'setup-cards' : 'setup-accounts');
            }}
          />

          <DrawerPanel
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            onNavigate={(screen) => {
              setActiveScreen(screen);
              setDrawerOpen(false);
            }}
          />
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scene: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80, // Above bottom nav
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
  },
});
