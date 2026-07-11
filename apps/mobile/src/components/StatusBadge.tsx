import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../theme/theme";
import type { EventStatus } from "../types/models";

const CONFIG: Record<EventStatus, { label: string; bg: string; fg: string }> = {
  ACTIVE: { label: "En planification", bg: colors.planningLight, fg: colors.planning },
  GRACE_PERIOD: { label: "En planification", bg: colors.planningLight, fg: colors.planning },
  ARCHIVED: { label: "Terminé", bg: colors.successLight, fg: colors.success },
};

export function StatusBadge({ status }: { status: EventStatus }) {
  const config = CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      {status === "ARCHIVED" && <Text style={{ color: config.fg }}>✓ </Text>}
      <Text style={[styles.label, { color: config.fg }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    alignSelf: "flex-start",
  },
  label: { fontSize: 12, fontWeight: "700" },
});
