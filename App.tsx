import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { lightTheme, darkTheme } from './src/theme';
import { useUiStore } from './src/store/useUiStore';
import RootNavigator from './src/navigation/RootNavigator';
import { enGB, registerTranslation } from 'react-native-paper-dates';

registerTranslation('en', enGB);

export default function App() {
  const isDark = useUiStore((s) => s.isDark);
  const theme = isDark ? darkTheme : lightTheme;

  const [fontsLoaded] = useFonts({
    PlusJakartaSans: require('./assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Medium': require('./assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-SemiBold': require('./assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('./assets/fonts/PlusJakartaSans-Bold.ttf'),
    'PlusJakartaSans-ExtraBold': require('./assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'PlusJakartaSans-Black': require('./assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
  });

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.background,
    },
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.colors.background} />
          <NavigationContainer theme={navTheme}>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
              <RootNavigator />
            </View>
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
