import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  SpaceGrotesk_400Regular,
} from '@expo-google-fonts/space-grotesk';
import { lightTheme, darkTheme } from './src/theme';
import { useUiStore } from './src/store/useUiStore';
import RootNavigator from './src/navigation/RootNavigator';
import { enGB, registerTranslation } from 'react-native-paper-dates';

registerTranslation('en', enGB);

export default function App() {
  const isDark = useUiStore((s) => s.isDark);
  const theme = isDark ? darkTheme : lightTheme;

  const [fontsLoaded] = useFonts({
    SpaceGrotesk: SpaceGrotesk_400Regular,
  });

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.background,
    },
  };

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#000000' }} />;
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
