// Shared color palette for Cards and Bank Accounts
// Each entry has a bright variant (light theme) and a dark variant (dark theme)

export interface ColorOption {
  key: string;
  label: string;
  light: string;  // bright card background for light mode
  dark: string;   // deep card background for dark mode
}

export const CARD_COLORS: ColorOption[] = [
  { key: 'slate',   label: 'Slate',    light: '#CBD5E1', dark: '#1E293B' },
  { key: 'rose',    label: 'Rose',     light: '#FECDD3', dark: '#4C0519' },
  { key: 'lime',    label: 'Lime',     light: '#D9F99D', dark: '#1A2E05' },
  { key: 'indigo',  label: 'Indigo',   light: '#C7D2FE', dark: '#1E1B4B' },
  { key: 'amber',   label: 'Amber',    light: '#FDE68A', dark: '#451A03' },
  { key: 'teal',    label: 'Teal',     light: '#99F6E4', dark: '#042F2E' },
  { key: 'violet',  label: 'Violet',   light: '#DDD6FE', dark: '#2E1065' },
  { key: 'sky',     label: 'Sky',      light: '#BAE6FD', dark: '#082F49' },
  { key: 'pink',    label: 'Pink',     light: '#FBCFE8', dark: '#500724' },
  { key: 'emerald', label: 'Emerald',  light: '#A7F3D0', dark: '#064E3B' },
  { key: 'orange',  label: 'Orange',   light: '#FED7AA', dark: '#431407' },
  { key: 'stone',   label: 'Stone',    light: '#D6D3D1', dark: '#1C1917' },
];

export function getCardColors(colorKey: string | undefined, isDark: boolean): { bg: string; textColor: string; mutedColor: string } {
  const found = CARD_COLORS.find(c => c.key === colorKey) ?? CARD_COLORS[0];
  const bg = isDark ? found.dark : found.light;
  const textColor = isDark ? '#FFFFFF' : '#111111';
  const mutedColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.50)';
  return { bg, textColor, mutedColor };
}
