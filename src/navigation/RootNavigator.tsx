import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, LayoutAnimation } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, IconButton, useTheme, BottomNavigation, Icon, Appbar } from 'react-native-paper';
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
    <Appbar.Header style={{ backgroundColor: theme.colors.background }} mode="center-aligned">
      <Appbar.Content 
        title="MyBanks" 
        titleStyle={{ fontSize: 22, fontWeight: '900', fontFamily: 'PlusJakartaSans-ExtraBold', color: theme.colors.onSurface }} 
      />
      <Appbar.Action 
        icon={isDark ? 'weather-sunny' : 'moon-waning-crescent'} 
        iconColor={isDark ? '#000000' : '#FFFFFF'} 
        style={{ backgroundColor: isDark ? '#AAEF00' : '#1c1c1c' }}
        onPress={handleToggleTheme} 
      />
    </Appbar.Header>
  );
}

// ─── Tab bar: icons only (no labels) ──────────────────────────
const TAB_META: Record<string, { focused: string; unfocused: string }> = {
  QR:       { focused: 'qrcode-scan',      unfocused: 'qrcode' },
  Cards:    { focused: 'card-bulleted',    unfocused: 'card-bulleted-outline' },
  Accounts: { focused: 'bank',             unfocused: 'bank-outline' },
  Settings: { focused: 'cog',             unfocused: 'cog-outline' },
};

function PaperTabBar({ navigation, state, descriptors, insets }: any) {
  return (
    <BottomNavigation.Bar
      navigationState={state}
      safeAreaInsets={insets}
      onTabPress={({ route, preventDefault }) => {
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });

        if (event.defaultPrevented) {
          preventDefault();
        } else {
         navigation.dispatch({
            ...CommonActions.navigate(route.name, route.params),
            target: state.key,
          });
        }
      }}
      renderIcon={({ route, focused, color }) => {
        const { options } = descriptors[route.key];
        if (options.tabBarIcon) {
          return options.tabBarIcon({ focused, color, size: 24 });
        }

        const meta = TAB_META[route.name] || { focused: 'circle', unfocused: 'circle-outline' };
        return <Icon source={focused ? meta.focused : meta.unfocused} color={color} size={24} />;
      }}
      getLabelText={({ route }) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        return label as string;
      }}
    />
  );
}

// ─── Main Screen (4 Tabs, no drawer) ──────────────────────────────
function MainScreen({ navigation }: any) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BottomTab.Navigator
        tabBar={props => <PaperTabBar {...props} />}
        sceneContainerStyle={{ backgroundColor: theme.colors.background }}
        screenOptions={{ headerShown: false, animation: 'shift' }}
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
