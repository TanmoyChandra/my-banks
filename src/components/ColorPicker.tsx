import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { CARD_COLORS, ColorOption } from '../constants/cardColors';

interface ColorPickerProps {
  selected: string | undefined;
  onSelect: (key: string) => void;
}

export default function ColorPicker({ selected, onSelect }: ColorPickerProps) {
  const theme = useTheme();
  return (
    <View>
      <Text style={styles.label}>Card Colour</Text>
      <View style={styles.grid}>
          {CARD_COLORS.map((c: ColorOption) => {
            const isSelected = (selected ?? CARD_COLORS[0].key) === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                onPress={() => onSelect(c.key)}
                style={styles.swatchContainer}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.selectionRing,
                  isSelected && { borderColor: '#AAEF00', borderWidth: 2 }
                ]}>
                  <LinearGradient
                    colors={[c.from, c.via, c.to]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.swatch}
                  />
                </View>
                <Text style={styles.swatchLabel}>{c.label}</Text>
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
    color: '#7A7A7A',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  swatchContainer: {
    alignItems: 'center',
    gap: 6,
  },
  selectionRing: {
    padding: 3,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  swatchLabel: {
    fontSize: 9,
    fontFamily: 'SpaceGrotesk',
    color: '#7A7A7A',
    letterSpacing: 0.3,
  },
});
