import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { lightTheme, darkTheme } from './src/theme';
import { useUiStore } from './src/store/useUiStore';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const isDark = useUiStore((s) => s.isDark);
  const theme = isDark ? darkTheme : lightTheme;

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.background,
    },
  };

  return (
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
