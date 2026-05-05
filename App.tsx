import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform, TouchableOpacity, Modal as RNModal, LayoutAnimation, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { 
  Provider as PaperProvider, 
  Portal, 
  Modal, 
  BottomNavigation,
  Text,
  MD3LightTheme,
  IconButton
} from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TabType, DrawerScreen } from './src/types';
import { useStore } from './src/store';
import { lightTheme, darkTheme } from './src/theme';

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
  const [activeScreen, setActiveScreen] = useState<DrawerScreen | null>(null);
  const [isDark, setIsDark] = useState(false);

  const theme = isDark ? darkTheme : lightTheme;
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
    { key: 'qr', title: 'UPI / QR', label: 'QR', focusedIcon: 'qrcode-scan', unfocusedIcon: 'qrcode', badge: qrEntries.length || undefined },
    { key: 'cards', title: 'Cards', label: 'Cards', focusedIcon: 'card-bulleted', unfocusedIcon: 'card-bulleted-outline', badge: cards.length || undefined },
    { key: 'accounts', title: 'Accounts', label: 'Accounts', focusedIcon: 'bank', unfocusedIcon: 'bank-outline', badge: accounts.length || undefined },
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

  const screens = {
    'setup-qr': <SetupQR entries={qrEntries} onAdd={addQR} onUpdate={updateQR} onDelete={deleteQR} onBack={() => setActiveScreen(null)} />,
    'setup-cards': <SetupCards cards={cards} onAdd={addCard} onUpdate={updateCard} onDelete={deleteCard} onBack={() => setActiveScreen(null)} />,
    'setup-accounts': <SetupAccounts accounts={accounts} onAdd={addAccount} onUpdate={updateAccount} onDelete={deleteAccount} onBack={() => setActiveScreen(null)} />,
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style={isDark ? "light" : "dark"} backgroundColor={theme.colors.background} />
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
            <IconButton icon="menu" size={24} iconColor={theme.colors.onSurface} style={[styles.headerButton, { backgroundColor: theme.colors.surface }]} onPress={() => setDrawerOpen(true)} />
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerSubtitle, { color: isDark ? '#a1a1aa' : '#71717a' }]}>My Banks</Text>
              <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>{routes[index].title}</Text>
            </View>
            <IconButton icon={isDark ? "white-balance-sun" : "moon-waning-crescent"} size={24} iconColor={theme.colors.onSurface} style={[styles.headerButton, { backgroundColor: theme.colors.surface }]} onPress={() => setIsDark(!isDark)} />
          </View>

          <BottomNavigation
            navigationState={{ index, routes }}
            onIndexChange={setIndex}
            renderScene={renderScene}
            barStyle={{ display: 'none' }}
          />

          <View style={[styles.customBottomBar, { backgroundColor: theme.colors.surface }]}>
            {routes.map((route, i) => {
              const isActive = index === i;
              return (
                <TouchableOpacity
                  key={route.key}
                  activeOpacity={0.8}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setIndex(i);
                  }}
                  style={[
                    styles.tabButton,
                    isActive && { backgroundColor: theme.colors.primary }
                  ]}
                >
                  <IconButton
                    icon={isActive ? route.focusedIcon : route.unfocusedIcon}
                    size={24}
                    iconColor={isActive ? '#000000' : (isDark ? '#a1a1aa' : '#71717a')}
                    style={{ margin: 0, width: 24, height: 24 }}
                  />
                  <Text style={[
                    styles.tabLabel,
                    { color: isActive ? '#000000' : (isDark ? '#a1a1aa' : '#71717a') }
                  ]}>
                    {route.label || route.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>



          <DrawerPanel
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            onNavigate={(screen) => {
              setDrawerOpen(false);
              setTimeout(() => setActiveScreen(screen), 300);
            }}
          />
        </View>

        <RNModal
          visible={!!activeScreen}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setActiveScreen(null)}
        >
          {activeScreen && screens[activeScreen as keyof typeof screens]}
        </RNModal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 56,
    paddingBottom: 16,
  },
  headerButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#09090b',
  },
  customBottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    padding: 8,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 24,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
  },
});
