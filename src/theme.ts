import { MD3LightTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  fontFamily: 'System',
};

export const theme = {
  ...MD3LightTheme,
  // Custom colors to match the purple brand
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6750A4',
    secondary: '#625B71',
    tertiary: '#7D5260',
    background: '#F6F2F9',
    surface: '#FEF7FF',
    surfaceVariant: '#E7E0EC',
    onSurface: '#1C1B1F',
    primaryContainer: '#EADDFF',
    secondaryContainer: '#E8DEF8',
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: '#F7F2FA',
      level2: '#F3EDF7',
      level3: '#EEE8F4',
    },
  },
};
