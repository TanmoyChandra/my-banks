import React, { useState } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { Surface, Text, IconButton, useTheme } from 'react-native-paper';

interface WelcomeBannerProps {
  onDismiss: () => void;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ onDismiss }) => {
  const [visible, setVisible] = useState(true);
  const theme = useTheme();
  const opacity = useState(new Animated.Value(1))[0];

  const handleDismiss = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      onDismiss();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View style={{ opacity }}>
      <Surface style={[styles.container, { backgroundColor: theme.colors.secondaryContainer }]} elevation={1}>
        <IconButton
          icon="information"
          size={24}
          iconColor={theme.colors.primary}
          style={styles.icon}
        />
        <Animated.View style={styles.content}>
          <Text variant="labelLarge" style={styles.title}>Welcome to My Banks!</Text>
          <Text variant="bodySmall" style={styles.description}>
            Tap the <Text style={{ fontWeight: 'bold' }}>menu</Text> to add your UPI, cards & bank accounts. Use the <Text style={{ fontWeight: 'bold' }}>+ button</Text> for quick access.
          </Text>
        </Animated.View>
        <IconButton
          icon="close"
          size={20}
          onPress={handleDismiss}
          style={styles.closeBtn}
        />
      </Surface>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 4,
  },
  icon: {
    margin: 4,
  },
  content: {
    flex: 1,
    paddingVertical: 12,
  },
  title: {
    fontWeight: '700',
    marginBottom: 2,
  },
  description: {
    lineHeight: 16,
  },
  closeBtn: {
    margin: 0,
  },
});

export default WelcomeBanner;
