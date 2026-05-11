// Card colour palette — gradient pairs matching the reference card designs.
// `from` → `via` → `to` are used to build a 135deg linear gradient on the card.

export interface ColorOption {
  key: string;
  label: string;
  from: string;
  via: string;
  to: string;
  glow1: string; // top-right ambient glow color
  glow2: string; // bottom-left ambient glow color
}

export const CARD_COLORS: ColorOption[] = [
  // ── Blues / Navy (Visa-style) ──────────────────────────────
  { key: 'navy',     label: 'Navy',     from: '#1a1a2e', via: '#16213e', to: '#0f3460',   glow1: '#4f8ef7', glow2: '#a78bfa' },
  { key: 'ocean',    label: 'Ocean',    from: '#0c1445', via: '#0a2d6e', to: '#1565C0',   glow1: '#42a5f5', glow2: '#7c83f7' },
  { key: 'midnight', label: 'Midnight', from: '#0d1b2a', via: '#1b263b', to: '#415a77',   glow1: '#778da9', glow2: '#4a6fa5' },

  // ── Oranges / Ambers (Mastercard-style) ───────────────────
  { key: 'amber',    label: 'Amber',    from: '#1c0a00', via: '#6b2400', to: '#8b3a00',   glow1: '#ff6b35', glow2: '#ffd700' },
  { key: 'copper',   label: 'Copper',   from: '#2a1000', via: '#7c3a00', to: '#b05a00',   glow1: '#ff8c42', glow2: '#f5c518' },
  { key: 'rust',     label: 'Rust',     from: '#1a0800', via: '#5c1a00', to: '#8b2000',   glow1: '#e55b00', glow2: '#d4a017' },

  // ── Greens (RuPay-style) ─────────────────────────────────
  { key: 'emerald',  label: 'Emerald',  from: '#0a2f1f', via: '#145a3c', to: '#1a7a52',   glow1: '#34d399', glow2: '#059669' },
  { key: 'forest',   label: 'Forest',   from: '#071a11', via: '#0e3a22', to: '#166534',   glow1: '#22c55e', glow2: '#15803d' },
  { key: 'teal',     label: 'Teal',     from: '#042f2e', via: '#115e59', to: '#1a7a74',   glow1: '#2dd4bf', glow2: '#0d9488' },

  // ── Purples / Violets ─────────────────────────────────────
  { key: 'violet',   label: 'Violet',   from: '#1a0533', via: '#3b0764', to: '#5b21b6',   glow1: '#c084fc', glow2: '#7c3aed' },
  { key: 'plum',     label: 'Plum',     from: '#200035', via: '#4a0070', to: '#6a0dad',   glow1: '#e879f9', glow2: '#a21caf' },

  // ── Reds / Rose ───────────────────────────────────────────
  { key: 'crimson',  label: 'Crimson',  from: '#1a0000', via: '#4c0519', to: '#7f1d1d',   glow1: '#f87171', glow2: '#b91c1c' },

  // ── Neutral / Dark ───────────────────────────────────────
  { key: 'graphite', label: 'Graphite', from: '#111111', via: '#2a2a2a', to: '#404040',   glow1: '#9ca3af', glow2: '#6b7280' },
];

export function getCardColors(
  colorKey: string | undefined,
): ColorOption {
  return CARD_COLORS.find(c => c.key === colorKey) ?? CARD_COLORS[0];
}
