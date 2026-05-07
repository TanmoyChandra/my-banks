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
import DrawerPanel from '../components/Drawer';
import OnboardingFlow from '../features/onboarding/OnboardingFlow';
import { DrawerScreen } from '../types';

const Stack = createNativeStackNavigator();
const BottomTab = createBottomTabNavigator();

// ─── Header ────────────────────────────────────────────────────
function AppHeader({ onMenuPress }: { onMenuPress: () => void }) {
  const theme = useTheme();
  const isDark = useUiStore(s => s.isDark);
  const toggleTheme = useUiStore(s => s.toggleTheme);

  const handleToggleTheme = () => {
    LayoutAnimation.configureNext({
      duration: 800,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'easeInEaseOut' },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    });
    toggleTheme();
  };

  return (
    <View style={[hStyles.header, { backgroundColor: theme.colors.background }]}>
      <IconButton
        icon="menu"
        size={24}
        iconColor={theme.colors.onSurface}
        style={[hStyles.headerBtn, { backgroundColor: theme.colors.surfaceVariant }]}
        onPress={onMenuPress}
      />
      <View style={hStyles.titleBox}>
        <Text style={[hStyles.title, { color: theme.colors.onSurface, fontFamily: 'PlusJakartaSans-ExtraBold' }]}>
          MyBanks
        </Text>
      </View>
      <IconButton
        icon={isDark ? 'weather-sunny' : 'moon-waning-crescent'}
        size={22}
        iconColor={isDark ? '#000000' : '#FFFFFF'}
        style={[hStyles.headerBtn, { backgroundColor: isDark ? '#AAEF00' : '#1c1c1c' }]}
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 56,
    paddingBottom: 16,
  },
  headerBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  titleBox: { alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '900' },
});

// ─── Tab bar: icons only (no labels) ──────────────────────────
const TAB_META: Record<string, { focused: string; unfocused: string }> = {
  QR:       { focused: 'qrcode-scan',      unfocused: 'qrcode' },
  Cards:    { focused: 'card-bulleted',    unfocused: 'card-bulleted-outline' },
  Accounts: { focused: 'bank',             unfocused: 'bank-outline' },
};

function FloatingTabBar({ state, navigation }: any) {
  const theme = useTheme();
  const isDark = useUiStore(s => s.isDark);

  return (
    <View
      style={[
        tStyles.bar,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isDark ? '#27272a' : '#F0F0F0',
          borderWidth: 1,
        },
      ]}
    >
      {state.routes.map((route: any, i: number) => {
        const isActive = state.index === i;
        const meta = TAB_META[route.name] || { focused: 'circle', unfocused: 'circle-outline' };
        const activeColor = isDark ? '#FFFFFF' : '#000000';
        const inactiveColor = isDark ? '#505050' : '#BDBDBD';

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.7}
            onPress={() => {
              LayoutAnimation.configureNext({
                duration: 400,
                create: { type: 'easeInEaseOut', property: 'opacity' },
                update: { type: 'easeInEaseOut' },
                delete: { type: 'easeInEaseOut', property: 'opacity' },
              });
              navigation.navigate(route.name);
            }}
            style={tStyles.tab}
          >
            <IconButton
              icon={isActive ? meta.focused : meta.unfocused}
              size={24}
              iconColor={isActive ? activeColor : inactiveColor}
              style={{ margin: 0, width: 24, height: 24 }}
            />
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
    left: 40,
    right: 40,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
});

// ─── Main Screen (Tabs + Drawer) ──────────────────────────────
function MainScreen({ navigation }: any) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const theme = useTheme();

  const handleDrawerNavigate = (screen: DrawerScreen) => {
    setDrawerOpen(false);
    setTimeout(() => {
      if (screen === 'setup-qr') navigation.navigate('SetupQR');
      else if (screen === 'setup-cards') navigation.navigate('SetupCards');
      else if (screen === 'setup-accounts') navigation.navigate('SetupAccounts');
    }, 300);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BottomTab.Navigator
        tabBar={props => <FloatingTabBar {...props} />}
        sceneContainerStyle={{ backgroundColor: theme.colors.background }}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <BottomTab.Screen name="QR">
          {() => <QRTab onMenuPress={() => setDrawerOpen(true)} />}
        </BottomTab.Screen>
        <BottomTab.Screen name="Cards">
          {() => <CardsTab onMenuPress={() => setDrawerOpen(true)} navigation={navigation} />}
        </BottomTab.Screen>
        <BottomTab.Screen name="Accounts">
          {() => <AccountsTab onMenuPress={() => setDrawerOpen(true)} />}
        </BottomTab.Screen>
      </BottomTab.Navigator>

      <DrawerPanel
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={handleDrawerNavigate}
      />
    </View>
  );
}

// ─── Tab Screen Wrappers ───────────────────────────────────────
function QRTab({ onMenuPress }: { onMenuPress: () => void }) {
  const entries = useWalletStore(s => s.upis);
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppHeader onMenuPress={onMenuPress} />
      <QRSection entries={entries} />
    </View>
  );
}

function CardsTab({ onMenuPress, navigation }: { onMenuPress: () => void; navigation: any }) {
  const cards = useWalletStore(s => s.cards);
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppHeader onMenuPress={onMenuPress} />
      <CardsSection
        cards={cards}
        onCardPress={(card: CardEntry) => navigation.navigate('CardTransactions', { cardId: card.id })}
      />
    </View>
  );
}

function AccountsTab({ onMenuPress }: { onMenuPress: () => void }) {
  const accounts = useWalletStore(s => s.accounts);
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppHeader onMenuPress={onMenuPress} />
      <BankAccountsSection accounts={accounts} />
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
