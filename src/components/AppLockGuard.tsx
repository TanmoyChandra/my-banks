import React, { useEffect, useState, useRef } from 'react';
import { View, AppState, AppStateStatus, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import * as LocalAuthentication from 'expo-local-authentication';
import { useUiStore } from '../store/useUiStore';

export default function AppLockGuard({ children }: { children: React.ReactNode }) {
  const isAppLockEnabled = useUiStore(s => s.isAppLockEnabled);
  const theme = useTheme();
  
  // Start locked if the feature is enabled.
  const [isUnlocked, setIsUnlocked] = useState(!isAppLockEnabled);
  const appState = useRef(AppState.currentState);
  
  useEffect(() => {
    let appStateSub: any;
    
    if (isAppLockEnabled) {
      if (!isUnlocked) {
        authenticate();
      }

      appStateSub = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
          // App came to foreground
          if (!isUnlocked) {
            authenticate();
          }
        } else if (nextAppState.match(/inactive|background/)) {
          // App went to background
          setIsUnlocked(false);
        }
        appState.current = nextAppState;
      });
    } else {
      setIsUnlocked(true);
    }

    return () => {
      if (appStateSub) {
        appStateSub.remove();
      }
    };
  }, [isAppLockEnabled, isUnlocked]);

  const authenticate = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsUnlocked(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock My Banks',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsUnlocked(true);
      } else {
        alert(`Authentication failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Authentication error: ${error.message || error}`);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
      {(!isUnlocked && isAppLockEnabled) && (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={styles.content}>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>App Locked</Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Please verify your identity to access your banks.
            </Text>
            <Button 
              mode="contained" 
              onPress={authenticate}
              style={[styles.btn, { backgroundColor: '#AAEF00' }]}
              labelStyle={styles.btnLabel}
              icon="fingerprint"
            >
              Unlock Now
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    fontFamily: 'SpaceGrotesk',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'SpaceGrotesk',
    marginBottom: 40,
    textAlign: 'center',
  },
  btn: {
    paddingHorizontal: 24,
    paddingVertical: 4,
    borderRadius: 16,
  },
  btnLabel: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'SpaceGrotesk',
    color: '#000000',
  }
});
