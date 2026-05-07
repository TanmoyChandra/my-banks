import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  fonts: configureFonts({
    config: {
      fontFamily: 'PlusJakartaSans',
    },
  }),
  colors: {
    ...MD3LightTheme.colors,
    primary: '#AAEF00', // Figma vivid lime
    onPrimary: '#000000',
    primaryContainer: '#AAEF00',
    onPrimaryContainer: '#000000',
    secondary: '#000000',
    tertiary: '#000000',
    background: '#FFFFFF',   // pure white per Figma
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5', // neutral light gray per Figma
    onSurface: '#000000',      // pure black headings per Figma
    onSurfaceVariant: '#6B7280',
    secondaryContainer: '#F5F5F5',
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#FFFFFF',
    },
  },
  roundness: 4,
};



export const darkTheme = {
  ...MD3DarkTheme,
  fonts: configureFonts({
    config: {
      fontFamily: 'PlusJakartaSans',
    },
  }),
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#AAEF00',
    onPrimary: '#000000',
    primaryContainer: '#AAEF00',
    onPrimaryContainer: '#000000',
    secondary: '#FFFFFF',
    tertiary: '#FFFFFF',
    background: '#09090b', // zinc-950
    surface: '#18181b', // zinc-900
    surfaceVariant: '#27272a', // zinc-800
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#a1a1aa',
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
