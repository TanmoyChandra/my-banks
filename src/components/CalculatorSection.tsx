import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, TextInput } from 'react-native';
import { Text, useTheme, IconButton, Avatar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { useUiStore } from '../store/useUiStore';

// Reusable card component for each calculator type
function CalcCard({
  icon,
  title,
  prefixText,
  xPlaceholder,
  yPlaceholder,
  separator,
  xValue,
  yValue,
  resultValue,
  onXChange,
  onYChange,
  onCalculate,
  onCopy,
}: {
  icon: string;
  title: string;
  prefixText?: string;
  xPlaceholder: string;
  yPlaceholder: string;
  separator: string;
  xValue: string;
  yValue: string;
  resultValue: string;
  onXChange: (val: string) => void;
  onYChange: (val: string) => void;
  onCalculate: () => void;
  onCopy: () => void;
}) {
  const theme = useTheme();
  const accentColor = '#AAEF00'; // Vibrant green from the design
  const isDark = theme.dark;
  const cardBg = isDark ? '#161616' : '#FFFFFF';
  const borderColor = isDark ? '#2C2C2E' : '#E5E5EA';
  const inputBg = isDark ? '#101010' : '#F2F2F7';
  const inputBorder = isDark ? '#242424' : '#D1D1D6';
  const textColor = theme.colors.onSurface;
  const placeholderColor = '#6A6A6C';

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(170, 239, 0, 0.08)' : 'rgba(170, 239, 0, 0.2)' }]}>
          <IconButton icon={icon} iconColor={accentColor} size={18} style={{ margin: 0 }} />
        </View>
        <Text style={[styles.cardTitle, { color: textColor }]}>{title}</Text>
      </View>

      {/* Inputs Row */}
      <View style={styles.inputRow}>
        {prefixText ? (
          <Text style={[styles.separatorText, { color: theme.colors.onSurfaceVariant, marginLeft: 0, marginRight: 8 }]}>
            {prefixText}
          </Text>
        ) : null}

        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
          placeholder={xPlaceholder}
          placeholderTextColor={placeholderColor}
          value={xValue}
          onChangeText={onXChange}
          keyboardType="numeric"
        />

        <Text style={[styles.separatorText, { color: theme.colors.onSurfaceVariant }]}>{separator}</Text>

        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
          placeholder={yPlaceholder}
          placeholderTextColor={placeholderColor}
          value={yValue}
          onChangeText={onYChange}
          keyboardType="numeric"
        />

        <Text style={[styles.separatorText, { color: theme.colors.onSurfaceVariant }]}>=</Text>
      </View>

      {/* Actions Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.calcButton, { backgroundColor: accentColor }]}
          onPress={() => {
            Keyboard.dismiss();
            onCalculate();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.calcButtonText}>Calculate</Text>
        </TouchableOpacity>

        <View style={[styles.resultBox, { backgroundColor: inputBg, borderColor: inputBorder }]}>
          <Text style={[styles.resultText, { color: resultValue ? textColor : placeholderColor }]}>
            {resultValue || 'Result'}
          </Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={onCopy}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <IconButton icon="content-copy" size={18} iconColor={placeholderColor} style={{ margin: 0 }} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function CalculatorSection() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const isDark = theme.dark;

  const userName = useUiStore(s => s.userName);
  const userImage = useUiStore(s => s.userImage);
  const initials = userName ? userName.charAt(0).toUpperCase() : '?';

  // State for Calculator 1: What is X% of Y?
  const [c1X, setC1X] = useState('');
  const [c1Y, setC1Y] = useState('');
  const [c1Res, setC1Res] = useState('');

  // State for Calculator 2: X is what percent of Y?
  const [c2X, setC2X] = useState('');
  const [c2Y, setC2Y] = useState('');
  const [c2Res, setC2Res] = useState('');

  // State for Calculator 3: Percentage Increase / Decrease
  const [c3X, setC3X] = useState('');
  const [c3Y, setC3Y] = useState('');
  const [c3Res, setC3Res] = useState('');

  const handleCalc1 = () => {
    const x = parseFloat(c1X);
    const y = parseFloat(c1Y);
    if (!isNaN(x) && !isNaN(y)) {
      setC1Res(((x / 100) * y).toFixed(2));
    } else {
      setC1Res('');
    }
  };

  const handleCalc2 = () => {
    const x = parseFloat(c2X);
    const y = parseFloat(c2Y);
    if (!isNaN(x) && !isNaN(y) && y !== 0) {
      setC2Res(((x / y) * 100).toFixed(2));
    } else {
      setC2Res('');
    }
  };

  const handleCalc3 = () => {
    const x = parseFloat(c3X);
    const y = parseFloat(c3Y);
    if (!isNaN(x) && !isNaN(y) && x !== 0) {
      const diff = y - x;
      setC3Res(((diff / Math.abs(x)) * 100).toFixed(2) + '%');
    } else {
      setC3Res('');
    }
  };

  const copyToClipboard = async (text: string) => {
    if (text) {
      await Clipboard.setStringAsync(text);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, paddingTop: insets.top + 16 }}>
        <View style={styles.sectionIntro}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={[styles.introTitle, { color: theme.colors.onSurface }]}>Calculator</Text>
            <Text style={[styles.introText, { color: theme.dark ? '#a1a1aa' : '#52525b' }]}>
              Quickly calculate percentages with ease.
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            {userImage ? (
              <Avatar.Image size={40} source={{ uri: userImage }} />
            ) : (
              <Avatar.Text
                size={40}
                label={initials}
                style={{ backgroundColor: theme.colors.primaryContainer }}
                labelStyle={{ color: theme.colors.onPrimaryContainer, fontWeight: '700' }}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Calc 1 */}
        <CalcCard
          icon="percent"
          title="What is X% of Y?"
          xPlaceholder="Enter %"
          yPlaceholder="Enter value"
          separator="% of"
          xValue={c1X}
          yValue={c1Y}
          resultValue={c1Res}
          onXChange={setC1X}
          onYChange={setC1Y}
          onCalculate={handleCalc1}
          onCopy={() => copyToClipboard(c1Res)}
        />

        {/* Calc 2 */}
        <CalcCard
          icon="chart-pie"
          title="X is what percent of Y?"
          xPlaceholder="Enter value"
          yPlaceholder="Enter value"
          separator="is what % of"
          xValue={c2X}
          yValue={c2Y}
          resultValue={c2Res}
          onXChange={setC2X}
          onYChange={setC2Y}
          onCalculate={handleCalc2}
          onCopy={() => copyToClipboard(c2Res)}
        />

        {/* Calc 3 */}
        <CalcCard
          icon="trending-up"
          title="Percentage Increase / Decrease"
          prefixText="from"
          xPlaceholder="old value"
          yPlaceholder="new value"
          separator="to"
          xValue={c3X}
          yValue={c3Y}
          resultValue={c3Res}
          onXChange={setC3X}
          onYChange={setC3Y}
          onCalculate={handleCalc3}
          onCopy={() => copyToClipboard(c3Res)}
        />

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? '#161616' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
          <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(170, 239, 0, 0.08)' : 'rgba(170, 239, 0, 0.2)' }]}>
            <IconButton icon="lightbulb-on" iconColor="#AAEF00" size={18} style={{ margin: 0 }} />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { color: '#AAEF00' }]}>How it works</Text>
            <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
              Enter the required values in the fields above and tap Calculate to get the result instantly.
            </Text>
          </View>
        </View>

      </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  sectionIntro: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 },
  introTitle: { fontSize: 28, fontWeight: '700', marginBottom: 6, fontFamily: 'SpaceGrotesk', letterSpacing: -0.5 },
  introText: { fontSize: 14, fontFamily: 'SpaceGrotesk', lineHeight: 20 },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 96,
  },

  // Card Styles
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk',
  },

  // Input Row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'SpaceGrotesk',
  },
  separatorText: {
    fontSize: 13,
    marginHorizontal: 8,
    fontFamily: 'SpaceGrotesk',
  },

  // Actions Row
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    height: 44,
  },
  calcButton: {
    flex: 0.45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calcButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk',
  },
  resultBox: {
    flex: 0.55,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 4,
  },
  resultText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk',
  },
  copyButton: {
    padding: 4,
  },

  // Info Card
  infoCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk',
    lineHeight: 18,
  },
});
