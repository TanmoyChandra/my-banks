import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { CARD_COLORS, ColorOption } from '../constants/cardColors';

interface ColorPickerProps {
  selected: string | undefined;
  onSelect: (key: string) => void;
}

export default function ColorPicker({ selected, onSelect }: ColorPickerProps) {
  const theme = useTheme();
  const isDark = theme.dark;

  return (
    <View>
      <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Card Color</Text>
      <View style={styles.grid}>
        {CARD_COLORS.map((c: ColorOption) => {
          const swatch = isDark ? c.dark : c.light;
          const isSelected = (selected ?? CARD_COLORS[0].key) === c.key;
          return (
            <TouchableOpacity
              key={c.key}
              onPress={() => onSelect(c.key)}
              style={[
                styles.swatch,
                { backgroundColor: swatch },
                isSelected && styles.swatchSelected,
              ]}
              activeOpacity={0.8}
            >
              {isSelected && (
                <Text style={[styles.checkmark, { color: isDark ? '#fff' : '#111' }]}>✓</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  swatch: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: '#C9F158',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '900',
  },
});
