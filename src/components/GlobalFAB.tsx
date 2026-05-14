import React from 'react';
import { StyleSheet } from 'react-native';
import { FAB, Portal } from 'react-native-paper';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GlobalFAB() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // Get the active tab name
  const state = useNavigationState(s => s);
  
  const getActiveTabName = (state: any): string | null => {
    if (!state || !state.routes || state.index === undefined) return null;
    const route = state.routes[state.index];
    
    // If the route has a nested state (like the BottomTab navigator), recurse into it
    if (route.state) {
      return getActiveTabName(route.state);
    }
    
    // Otherwise, return the name of the current active route
    return route.name;
  };

  const activeTab = getActiveTabName(state);
  const bottomOffset = insets.bottom + 80 + 16;

  // Map active tab to its respective setup page
  // The user wants visibility ONLY on these 4 main pages
  const visibleTabs: Record<string, string> = {
    'QR': 'SetupQR',
    'Cards': 'SetupCards',
    'Merchants': 'SetupMerchantQR',
    'Accounts': 'SetupAccounts',
  };

  const targetScreen = activeTab ? visibleTabs[activeTab] : null;

  // If we are NOT on one of the 4 allowed tabs, do not render anything
  if (!targetScreen) {
    return null;
  }

  return (
    <Portal>
      <FAB
        icon="plus"
        onPress={() => navigation.navigate(targetScreen)}
        style={[
          styles.standaloneFab,
          { 
            backgroundColor: '#AAEF00',
            bottom: bottomOffset,
          }
        ]}
        color="#000000"
      />
    </Portal>
  );
}

const styles = StyleSheet.create({
  standaloneFab: {
    position: 'absolute',
    right: 16,
    borderRadius: 18,
    elevation: 4,
  }
});
