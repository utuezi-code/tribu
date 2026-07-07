/**
 * Valeurs extraites des maquettes haute-fidélité fournies (captures d'écran).
 * Toute valeur non déductible des maquettes (ex: nuances de gris intermédiaires,
 * élévation des ombres) est une estimation raisonnable à ajuster si un design
 * system détaillé (tokens Figma) est fourni ultérieurement.
 */
export const colors = {
  background: "#F5F2FB",
  surface: "#FFFFFF",
  primary: "#7B6EF6",
  primaryDark: "#5F4FE0",
  primaryLight: "#EDE9FE",
  text: "#1F1B2E",
  textSecondary: "#6B6580",
  textMuted: "#9C97AE",
  border: "#E7E2F5",
  success: "#2FBF71",
  successLight: "#E4F8ED",
  danger: "#E5484D",
  bubbleSent: "#7B6EF6",
  bubbleReceived: "#FFFFFF",
  overlayDark: "rgba(20, 16, 40, 0.55)",
  avatarPalette: ["#F2A7B0", "#8CD8C8", "#9FB4F2", "#F4C88A", "#C9A6F2", "#7FD1E0"],
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 28, fontWeight: "700" as const },
  heading: { fontSize: 18, fontWeight: "700" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  bodyBold: { fontSize: 15, fontWeight: "600" as const },
  caption: { fontSize: 13, fontWeight: "400" as const },
};

export const eventTypeEmoji: Record<string, string> = {
  VOYAGE: "🧳",
  MARIAGE: "💍",
  ANNIVERSAIRE: "🎂",
  SOIREE: "🎉",
  AUTRE: "✨",
};
