// Shared color palette for Cards and Bank Accounts
// Each entry has a rich deep variant for both themes

export interface ColorOption {
  key: string;
  label: string;
  light: string;  // rich card background for light mode (deep/saturated)
  dark: string;   // deep card background for dark mode
}

export const CARD_COLORS: ColorOption[] = [
  { key: 'slate',   label: 'Slate',    light: '#334155', dark: '#0F172A' },
  { key: 'rose',    label: 'Rose',     light: '#9F1239', dark: '#4C0519' },
  { key: 'lime',    label: 'Lime',     light: '#3F6212', dark: '#1A2E05' },
  { key: 'indigo',  label: 'Indigo',   light: '#3730A3', dark: '#1E1B4B' },
  { key: 'amber',   label: 'Amber',    light: '#92400E', dark: '#451A03' },
  { key: 'teal',    label: 'Teal',     light: '#115E59', dark: '#042F2E' },
  { key: 'violet',  label: 'Violet',   light: '#5B21B6', dark: '#2E1065' },
  { key: 'sky',     label: 'Sky',      light: '#0C4A6E', dark: '#082F49' },
  { key: 'pink',    label: 'Pink',     light: '#831843', dark: '#500724' },
  { key: 'emerald', label: 'Emerald',  light: '#064E3B', dark: '#022C22' },
  { key: 'orange',  label: 'Orange',   light: '#7C2D12', dark: '#431407' },
  { key: 'stone',   label: 'Stone',    light: '#292524', dark: '#1C1917' },
];

export function getCardColors(colorKey: string | undefined, isDark: boolean): { bg: string; textColor: string; mutedColor: string } {
  const found = CARD_COLORS.find(c => c.key === colorKey) ?? CARD_COLORS[0];
  const bg = isDark ? found.dark : found.light;
  // Always white text — both light & dark card backgrounds are now deep/dark
  const textColor = '#FFFFFF';
  const mutedColor = 'rgba(255,255,255,0.55)';
  return { bg, textColor, mutedColor };
}
