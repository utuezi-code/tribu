/**
 * Palette repensée d'après les patterns UI/UX de WhatsApp (couleur dominante
 * verte) et le choix explicite d'une couleur "psychologiquement engageante"
 * pour la rétention — voir DECISIONS.md pour la justification complète.
 * Reste un vert propre à Tribu (pas un clone exact de #25D366) : même famille
 * chromatique et mêmes associations (calme, "go", faible fatigue oculaire
 * en usage prolongé) sans être une copie littérale de la marque WhatsApp.
 */
export const colors = {
  background: "#F5F8F6",
  surface: "#FFFFFF",
  primary: "#1DB876",
  primaryDark: "#128C5E",
  primaryLight: "#DFF6EA",
  text: "#16211C",
  textSecondary: "#5B6B63",
  textMuted: "#8A9791",
  border: "#E2E8E4",
  success: "#1DB876",
  successLight: "#DFF6EA",
  danger: "#E5484D",
  // Distinct de `primary`/`success` (les deux verts) : nécessaire pour que le
  // badge "En planification" reste visuellement différent du badge "Terminé"
  // maintenant que la couleur de marque et la couleur de succès sont unifiées.
  planning: "#B45309",
  planningLight: "#FEF3C7",
  bubbleSent: "#D9F5DD",
  bubbleReceived: "#FFFFFF",
  overlayDark: "rgba(10, 20, 16, 0.55)",
  avatarPalette: ["#F2A7B0", "#8CD8C8", "#9FB4F2", "#F4C88A", "#C9A6F2", "#7FD1E0"],
  gradientAuth: ["#34D399", "#1DB876", "#0F7A52"],
  glow: "rgba(29, 184, 118, 0.35)",
} as const;

export const shadows = {
  soft: {
    shadowColor: "#0B3D2A",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  button: {
    shadowColor: "#128C5E",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
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
