import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, LayoutAnimation, Animated } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, IconButton, useTheme } from 'react-native-paper';
import { useUiStore } from '../store/useUiStore';
import { useWalletStore } from '../store/useWalletStore';

// Existing components — completely untouched
import QRSection from '../components/QRSection';
import CardsSection from '../components/CardsSection';
import BankAccountsSection from '../components/BankAccountsSection';
import SetupQR from '../components/setup/SetupQR';
import SetupCards from '../components/setup/SetupCards';
import SetupAccounts from '../components/setup/SetupAccounts';
import DrawerPanel from '../components/Drawer';
import OnboardingFlow from '../features/onboarding/OnboardingFlow';
import { DrawerScreen } from '../types';

const Stack = createNativeStackNavigator();
const TopTab = createMaterialTopTabNavigator();

// ─── Header ────────────────────────────────────────────────────
function AppHeader({ title, onMenuPress }: { title: string; onMenuPress: () => void }) {
  const theme = useTheme();
  const isDark = useUiStore(s => s.isDark);
  const toggleTheme = useUiStore(s => s.toggleTheme);

  return (
    <View style={[hStyles.header, { backgroundColor: theme.colors.background }]}>
      <IconButton icon="menu" size={24} iconColor={theme.colors.onSurface}
        style={[hStyles.headerBtn, { backgroundColor: theme.colors.surface }]}
        onPress={onMenuPress} />
      <View style={hStyles.titleBox}>
        <Text style={[hStyles.sub, { color: isDark ? '#a1a1aa' : '#71717a' }]}>My Banks</Text>
        <Text style={[hStyles.title, { color: theme.colors.onSurface }]}>{title}</Text>
      </View>
      <IconButton icon={isDark ? 'white-balance-sun' : 'moon-waning-crescent'} size={24}
        iconColor={theme.colors.onSurface}
        style={[hStyles.headerBtn, { backgroundColor: theme.colors.surface }]}
        onPress={toggleTheme} />
    </View>
  );
}

const hStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 40 : 56, paddingBottom: 16 },
  headerBtn: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  titleBox: { alignItems: 'center' },
  sub: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '900' },
});

// ─── Custom Bottom Tab Bar (positioned at bottom, driven by material-top-tabs) ─
const TAB_META: Record<string, { label: string; focused: string; unfocused: string }> = {
  QR: { label: 'QR', focused: 'qrcode-scan', unfocused: 'qrcode' },
  Cards: { label: 'Cards', focused: 'card-bulleted', unfocused: 'card-bulleted-outline' },
  Accounts: { label: 'Accounts', focused: 'bank', unfocused: 'bank-outline' },
};

function FloatingTabBar({ state, navigation, position }: any) {
  const theme = useTheme();
  const isDark = useUiStore(s => s.isDark);

  return (
    <View style={[tStyles.bar, { backgroundColor: theme.colors.surface }]}>
      {state.routes.map((route: any, i: number) => {
        const isActive = state.index === i;
        const meta = TAB_META[route.name] || { label: route.name, focused: 'circle', unfocused: 'circle-outline' };

        // Animate the pill background opacity based on swipe position
        const opacity = position.interpolate({
          inputRange: state.routes.map((_: any, idx: number) => idx),
          outputRange: state.routes.map((_: any, idx: number) => (idx === i ? 1 : 0)),
        });

        return (
          <TouchableOpacity key={route.key} activeOpacity={0.8}
            onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); navigation.navigate(route.name); }}
            style={tStyles.tab}>
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.primary, borderRadius: 24, opacity }]} />
            <IconButton icon={isActive ? meta.focused : meta.unfocused} size={24}
              iconColor={isActive ? '#000' : isDark ? '#a1a1aa' : '#71717a'}
              style={{ margin: 0, width: 24, height: 24 }} />
            <Text style={[tStyles.label, { color: isActive ? '#000' : isDark ? '#a1a1aa' : '#71717a' }]}>
              {meta.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tStyles = StyleSheet.create({
  bar: { position: 'absolute', bottom: Platform.OS === 'ios' ? 24 : 16, left: 16, right: 16, flexDirection: 'row', padding: 8, borderRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, justifyContent: 'space-between' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 24, overflow: 'hidden' },
  label: { fontSize: 12, fontWeight: '900', marginTop: 4 },
});

// ─── Main Screen (Tabs + Drawer) ──────────────────────────────
function MainScreen({ navigation }: any) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleDrawerNavigate = (screen: DrawerScreen) => {
    setDrawerOpen(false);
    setTimeout(() => {
      if (screen === 'setup-qr') navigation.navigate('SetupQR');
      else if (screen === 'setup-cards') navigation.navigate('SetupCards');
      else if (screen === 'setup-accounts') navigation.navigate('SetupAccounts');
    }, 300);
  };

  return (
    <View style={{ flex: 1 }}>
      <TopTab.Navigator
        tabBarPosition="bottom"
        tabBar={props => <FloatingTabBar {...props} />}
        screenOptions={{
          swipeEnabled: true,
          animationEnabled: true,
        }}
      >
        <TopTab.Screen name="QR">
          {() => <QRTab onMenuPress={() => setDrawerOpen(true)} onSetup={() => navigation.navigate('SetupQR')} />}
        </TopTab.Screen>
        <TopTab.Screen name="Cards">
          {() => <CardsTab onMenuPress={() => setDrawerOpen(true)} onSetup={() => navigation.navigate('SetupCards')} />}
        </TopTab.Screen>
        <TopTab.Screen name="Accounts">
          {() => <AccountsTab onMenuPress={() => setDrawerOpen(true)} onSetup={() => navigation.navigate('SetupAccounts')} />}
        </TopTab.Screen>
      </TopTab.Navigator>

      <DrawerPanel
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={handleDrawerNavigate}
      />
    </View>
  );
}

// ─── Tab Screen Wrappers ───────────────────────────────────────
function QRTab({ onMenuPress, onSetup }: { onMenuPress: () => void; onSetup: () => void }) {
  const entries = useWalletStore(s => s.upis);
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppHeader title="UPI / QR" onMenuPress={onMenuPress} />
      <QRSection entries={entries} onSetup={onSetup} />
    </View>
  );
}

function CardsTab({ onMenuPress, onSetup }: { onMenuPress: () => void; onSetup: () => void }) {
  const cards = useWalletStore(s => s.cards);
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppHeader title="Cards" onMenuPress={onMenuPress} />
      <CardsSection cards={cards} onSetup={onSetup} />
    </View>
  );
}

function AccountsTab({ onMenuPress, onSetup }: { onMenuPress: () => void; onSetup: () => void }) {
  const accounts = useWalletStore(s => s.accounts);
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppHeader title="Accounts" onMenuPress={onMenuPress} />
      <BankAccountsSection accounts={accounts} onSetup={onSetup} />
    </View>
  );
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
  const hasCompletedOnboarding = useUiStore(s => s.hasCompletedOnboarding);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!hasCompletedOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingFlow} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainScreen} />
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
