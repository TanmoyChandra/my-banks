import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UiState {
  hasCompletedOnboarding: boolean;
  userName: string;
  isDark: boolean;

  completeOnboarding: (name: string) => void;
  setUserName: (name: string) => void;
  toggleTheme: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      userName: '',
      isDark: true,

      completeOnboarding: (name) =>
        set({ hasCompletedOnboarding: true, userName: name }),
      setUserName: (name) => set({ userName: name }),
      toggleTheme: () => set((s) => ({ isDark: !s.isDark })),
    }),
    {
      name: 'mybanks-ui',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
