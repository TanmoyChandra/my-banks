import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { CARD_COLORS, ColorOption } from '../constants/cardColors';

interface ColorPickerProps {
  selected: string | undefined;
  onSelect: (key: string) => void;
}

export default function ColorPicker({ selected, onSelect }: ColorPickerProps) {
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
              style={[styles.swatchWrap, isSelected && styles.swatchSelected]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[c.from, c.via, c.to]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.swatch}
              >
                {isSelected && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </LinearGradient>
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
    gap: 10,
    marginBottom: 16,
  },
  swatchWrap: {
    alignItems: 'center',
    gap: 4,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchSelected: {
    // outer ring
    borderWidth: 2.5,
    borderColor: '#C9F158',
    borderRadius: 24,
    padding: 1,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  swatchLabel: {
    fontSize: 9,
    fontFamily: 'SpaceGrotesk',
    color: '#7A7A7A',
    letterSpacing: 0.3,
  },
});
