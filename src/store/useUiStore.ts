import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UiState {
  hasCompletedOnboarding: boolean;
  userName: string;
  userImage?: string; // Base64 or local URI
  isDark: boolean;
  isAppLockEnabled: boolean;

  completeOnboarding: (name: string) => void;
  setUserName: (name: string) => void;
  setUserImage: (uri?: string) => void;
  toggleTheme: () => void;
  setAppLockEnabled: (val: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      userName: '',
      isDark: true,
      isAppLockEnabled: false,

      completeOnboarding: (name) =>
        set({ hasCompletedOnboarding: true, userName: name }),
      setUserName: (name) => set({ userName: name }),
      setUserImage: (uri) => set({ userImage: uri }),
      toggleTheme: () => set((s) => ({ isDark: !s.isDark })),
      setAppLockEnabled: (val) => set({ isAppLockEnabled: val }),
    }),
    {
      name: 'mybanks-ui',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
