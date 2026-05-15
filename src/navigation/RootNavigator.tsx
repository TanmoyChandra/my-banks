import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, IconButton, useTheme, BottomNavigation, Icon } from 'react-native-paper';
import { useUiStore } from '../store/useUiStore';
import { useWalletStore } from '../store/useWalletStore';
import { CardEntry } from '../types';

// Components
import QRSection from '../components/QRSection';
import CardsSection from '../components/CardsSection';
import BankAccountsSection from '../components/BankAccountsSection';
import MerchantQRSection from '../components/MerchantQRSection';
import CardTransactions from '../components/CardTransactions';
import SetupQR from '../components/setup/SetupQR';
import SetupCards from '../components/setup/SetupCards';
import SetupAccounts from '../components/setup/SetupAccounts';
import SetupMerchantQR from '../components/setup/SetupMerchantQR';
import SettingsScreen from '../components/SettingsScreen';
import OnboardingFlow from '../features/onboarding/OnboardingFlow';
import BackupRestoreSettings from '../components/BackupRestoreSettings';

const Stack = createNativeStackNavigator();
const BottomTab = createBottomTabNavigator();

// ─── Tab bar ──────────────────────────────────────────────────
const TAB_META: Record<string, { focused: string; unfocused: string }> = {
  QR:        { focused: 'qrcode-scan',      unfocused: 'qrcode' },
  Cards:     { focused: 'card-bulleted',    unfocused: 'card-bulleted-outline' },
  Merchants: { focused: 'store',            unfocused: 'store-outline' },
  Accounts:  { focused: 'bank',             unfocused: 'bank-outline' },
  Settings:  { focused: 'cog',              unfocused: 'cog-outline' },
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

// ─── Main Screen ──────────────────────────────────────────────
function MainScreen({ navigation }: any) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BottomTab.Navigator
        tabBar={props => <PaperTabBar {...props} />}
        sceneContainerStyle={{ backgroundColor: theme.colors.background }}
        screenOptions={{ headerShown: false, animation: 'shift' }}
      >
        <BottomTab.Screen name="QR">{() => <QRTab />}</BottomTab.Screen>
        <BottomTab.Screen name="Cards">{() => <CardsTab navigation={navigation} />}</BottomTab.Screen>
        <BottomTab.Screen name="Merchants">{() => <MerchantsTab />}</BottomTab.Screen>
        <BottomTab.Screen name="Accounts">{() => <AccountsTab />}</BottomTab.Screen>
        <BottomTab.Screen name="Settings">{() => <SettingsTab navigation={navigation} />}</BottomTab.Screen>
      </BottomTab.Navigator>
    </View>
  );
}

// ─── Tab Wrappers ──────────────────────────────────────────────
function QRTab() {
  const entries = useWalletStore(s => s.upis);
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <QRSection entries={entries} />
    </View>
  );
}

function CardsTab({ navigation }: { navigation: any }) {
  const cards = useWalletStore(s => s.cards);
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
      <BankAccountsSection accounts={accounts} />
    </View>
  );
}

function MerchantsTab() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <MerchantQRSection />
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
          else if (screen === 'setup-merchant-qr') navigation.navigate('SetupMerchantQR');
          else if (screen === 'setup-backup') navigation.navigate('SetupBackup');
        }}
      />
    </View>
  );
}

// ─── Stack Screen Wrappers ─────────────────────────────────────
function CardTransactionsScreen({ route, navigation }: any) {
  const { cardId } = route.params;
  const cards = useWalletStore(s => s.cards);
  const card = cards.find(c => c.id === cardId);
  if (!card) return null;
  return <CardTransactions card={card} onBack={() => navigation.goBack()} />;
}

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

function SetupMerchantQRScreen({ navigation }: any) {
  return <SetupMerchantQR onBack={() => navigation.goBack()} />;
}

function SetupBackupScreen({ navigation }: any) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 8, paddingTop: 52, paddingBottom: 12,
        backgroundColor: theme.colors.surface,
      }}>
        <IconButton icon="close" size={24} onPress={() => navigation.goBack()} />
        <Text style={{ flex: 1, fontSize: 20, fontWeight: '900', fontFamily: 'SpaceGrotesk', color: theme.colors.onSurface }}>
          Backup & Restore
        </Text>
      </View>
      <View style={{ flex: 1, padding: 16 }}>
        <BackupRestoreSettings />
      </View>
    </View>
  );
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
            <Stack.Screen name="SetupMerchantQR" component={SetupMerchantQRScreen} />
            <Stack.Screen name="SetupBackup" component={SetupBackupScreen} />
          </Stack.Group>
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({});
