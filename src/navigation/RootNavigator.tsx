import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, LayoutAnimation } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, IconButton, useTheme } from 'react-native-paper';
import { useUiStore } from '../store/useUiStore';
import { useWalletStore } from '../store/useWalletStore';
import { CardEntry } from '../types';

// Components
import QRSection from '../components/QRSection';
import CardsSection from '../components/CardsSection';
import BankAccountsSection from '../components/BankAccountsSection';
import CardTransactions from '../components/CardTransactions';
import SetupQR from '../components/setup/SetupQR';
import SetupCards from '../components/setup/SetupCards';
import SetupAccounts from '../components/setup/SetupAccounts';
import SettingsScreen from '../components/SettingsScreen';
import OnboardingFlow from '../features/onboarding/OnboardingFlow';

const Stack = createNativeStackNavigator();
const BottomTab = createBottomTabNavigator();

// ─── Header ────────────────────────────────────────────────────
function AppHeader() {
  const theme = useTheme();
  const isDark = useUiStore(s => s.isDark);
  const toggleTheme = useUiStore(s => s.toggleTheme);

  const handleToggleTheme = () => {
    LayoutAnimation.configureNext({
      duration: 600,
      update: { type: 'easeInEaseOut' },
    });
    toggleTheme();
  };

  return (
    <View style={[hStyles.header, { backgroundColor: theme.colors.background }]}>
      <Text style={[hStyles.title, { color: theme.colors.onSurface }]}>MyBanks</Text>
      <IconButton
        icon={isDark ? 'weather-sunny' : 'moon-waning-crescent'}
        size={20}
        iconColor={isDark ? '#000000' : '#FFFFFF'}
        style={[hStyles.themeBtn, { backgroundColor: isDark ? '#AAEF00' : '#1c1c1c' }]}
        onPress={handleToggleTheme}
      />
    </View>
  );
}

const hStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 44 : 56,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  themeBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});

// ─── Tab bar: icons only (no labels) ──────────────────────────
const TAB_META: Record<string, { focused: string; unfocused: string }> = {
  QR:       { focused: 'qrcode-scan',      unfocused: 'qrcode' },
  Cards:    { focused: 'card-bulleted',    unfocused: 'card-bulleted-outline' },
  Accounts: { focused: 'bank',             unfocused: 'bank-outline' },
  Settings: { focused: 'cog',             unfocused: 'cog-outline' },
};

function FloatingTabBar({ state, navigation }: any) {
  const theme = useTheme();
  const isDark = useUiStore(s => s.isDark);

  return (
    <View
      style={[
        tStyles.bar,
        {
          backgroundColor: theme.colors.elevation.level2,
        },
      ]}
    >
      {state.routes.map((route: any, i: number) => {
        const isActive = state.index === i;
        const meta = TAB_META[route.name] || { focused: 'circle', unfocused: 'circle-outline' };
        
        // M3 Navigation Bar colors
        const activeIconColor = theme.colors.onSecondaryContainer;
        const inactiveIconColor = theme.colors.onSurfaceVariant;
        const activeBgColor = theme.colors.secondaryContainer;

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.8}
            onPress={() => {
              LayoutAnimation.configureNext({
                duration: 300,
                create: { type: 'easeInEaseOut', property: 'opacity' },
                update: { type: 'easeInEaseOut', springDamping: 0.8 },
                delete: { type: 'easeInEaseOut', property: 'opacity' },
              });
              navigation.navigate(route.name);
            }}
            style={tStyles.tabContainer}
          >
            <View style={[
              tStyles.pill, 
              isActive && { backgroundColor: activeBgColor }
            ]}>
              <IconButton
                icon={isActive ? meta.focused : meta.unfocused}
                size={26}
                iconColor={isActive ? activeIconColor : inactiveIconColor}
                style={{ margin: 0, width: 28, height: 28 }}
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tStyles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 16,
    left: 24,
    right: 24,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 24, // M3 pill shape
    alignItems: 'center',
    justifyContent: 'center',
  }
});

// ─── Main Screen (4 Tabs, no drawer) ──────────────────────────────
function MainScreen({ navigation }: any) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BottomTab.Navigator
        tabBar={props => <FloatingTabBar {...props} />}
        sceneContainerStyle={{ backgroundColor: theme.colors.background }}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <BottomTab.Screen name="QR">
          {() => <QRTab />}
        </BottomTab.Screen>
        <BottomTab.Screen name="Cards">
          {() => <CardsTab navigation={navigation} />}
        </BottomTab.Screen>
        <BottomTab.Screen name="Accounts">
          {() => <AccountsTab />}
        </BottomTab.Screen>
        <BottomTab.Screen name="Settings">
          {() => <SettingsTab navigation={navigation} />}
        </BottomTab.Screen>
      </BottomTab.Navigator>
    </View>
  );
}

// ─── Tab Screen Wrappers ───────────────────────────────────────
function QRTab() {
  const entries = useWalletStore(s => s.upis);
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppHeader />
      <QRSection entries={entries} />
    </View>
  );
}

function CardsTab({ navigation }: { navigation: any }) {
  const cards = useWalletStore(s => s.cards);
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppHeader />
      <CardsSection
        cards={cards}
        onCardPress={(card: CardEntry) => navigation.navigate('CardTransactions', { cardId: card.id })}
      />
    </View>
  );
}

function AccountsTab() {
  const accounts = useWalletStore(s => s.accounts);
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppHeader />
      <BankAccountsSection accounts={accounts} />
    </View>
  );
}

function SettingsTab({ navigation }: { navigation: any }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SettingsScreen
        onNavigate={(screen) => {
          if (screen === 'setup-qr') navigation.navigate('SetupQR');
          else if (screen === 'setup-cards') navigation.navigate('SetupCards');
          else if (screen === 'setup-accounts') navigation.navigate('SetupAccounts');
        }}
      />
    </View>
  );
}

// ─── Card Transactions Wrapper ─────────────────────────────────
function CardTransactionsScreen({ route, navigation }: any) {
  const { cardId } = route.params;
  const cards = useWalletStore(s => s.cards);
  const card = cards.find(c => c.id === cardId);

  if (!card) {
    return null;
  }

  return <CardTransactions card={card} onBack={() => navigation.goBack()} />;
}

// ─── Setup Screen Wrappers ─────────────────────────────────────
function SetupQRScreen({ navigation }: any) {
  const entries = useWalletStore(s => s.upis);
  const addQR = useWalletStore(s => s.addUpi);
  const updateQR = useWalletStore(s => s.updateUpi);
  const deleteQR = useWalletStore(s => s.deleteUpi);
  return <SetupQR entries={entries} onAdd={addQR} onUpdate={updateQR} onDelete={deleteQR} onBack={() => navigation.goBack()} />;
}

function SetupCardsScreen({ navigation }: any) {
  const cards = useWalletStore(s => s.cards);
  const addCard = useWalletStore(s => s.addCard);
  const updateCard = useWalletStore(s => s.updateCard);
  const deleteCard = useWalletStore(s => s.deleteCard);
  return <SetupCards cards={cards} onAdd={addCard} onUpdate={updateCard} onDelete={deleteCard} onBack={() => navigation.goBack()} />;
}

function SetupAccountsScreen({ navigation }: any) {
  const accounts = useWalletStore(s => s.accounts);
  const addAccount = useWalletStore(s => s.addAccount);
  const updateAccount = useWalletStore(s => s.updateAccount);
  const deleteAccount = useWalletStore(s => s.deleteAccount);
  return <SetupAccounts accounts={accounts} onAdd={addAccount} onUpdate={updateAccount} onDelete={deleteAccount} onBack={() => navigation.goBack()} />;
}

// ─── Root Navigator ────────────────────────────────────────────
export default function RootNavigator() {
  const theme = useTheme();
  const hasCompletedOnboarding = useUiStore(s => s.hasCompletedOnboarding);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      {!hasCompletedOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingFlow} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainScreen} />
          <Stack.Group screenOptions={{ presentation: 'card', animation: 'slide_from_right' }}>
            <Stack.Screen name="CardTransactions" component={CardTransactionsScreen} />
          </Stack.Group>
          <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen name="SetupQR" component={SetupQRScreen} />
            <Stack.Screen name="SetupCards" component={SetupCardsScreen} />
            <Stack.Screen name="SetupAccounts" component={SetupAccountsScreen} />
          </Stack.Group>
        </>
      )}
    </Stack.Navigator>
  );
}
