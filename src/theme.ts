import { MD3LightTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  fontFamily: 'System',
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#BEF264', // lime-300
    onPrimary: '#000000',
    primaryContainer: '#BEF264',
    onPrimaryContainer: '#000000',
    secondary: '#000000',
    tertiary: '#000000',
    background: '#fbfaf6',
    surface: '#FFFFFF',
    surfaceVariant: '#f4f4f5', // zinc-100
    onSurface: '#09090b', // zinc-950
    secondaryContainer: '#FFFFFF',
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#FFFFFF',
    },
  },
  roundness: 4,
};

import { MD3DarkTheme } from 'react-native-paper';

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#BEF264',
    onPrimary: '#000000',
    primaryContainer: '#BEF264',
    onPrimaryContainer: '#000000',
    secondary: '#FFFFFF',
    tertiary: '#FFFFFF',
    background: '#09090b', // zinc-950
    surface: '#18181b', // zinc-900
    surfaceVariant: '#27272a', // zinc-800
    onSurface: '#FFFFFF',
    secondaryContainer: '#18181b',
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level1: '#18181b',
      level2: '#18181b',
      level3: '#18181b',
    },
  },
  roundness: 4,
};
