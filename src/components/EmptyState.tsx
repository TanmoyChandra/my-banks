import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Avatar } from 'react-native-paper';

interface EmptyStateProps {
  icon: string;
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, message }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Avatar.Icon 
        size={80} 
        icon={icon} 
        style={[styles.iconBox, { backgroundColor: theme.colors.surfaceVariant }]} 
        color={theme.colors.onSurfaceVariant} 
      />
      <Text style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  iconBox: {
    opacity: 0.4,
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.7,
  },
});

export default EmptyState;
