import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, eventTypeEmoji, radii, spacing, typography } from "../theme/theme";
import { formatCountdown } from "../utils/countdown";
import type { TribuEvent } from "../types/models";
import { AvatarStack } from "./Avatar";
import { StatusBadge } from "./StatusBadge";

function formatDateRange(startDate: string, endDate: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const start = new Date(startDate).toLocaleDateString("fr-FR", opts);
  const end = new Date(endDate).toLocaleDateString("fr-FR", opts);
  return `${start} – ${end}`;
}

export function EventCard({ event, onPress }: { event: TribuEvent; onPress: () => void }) {
  const memberCount = event.members.length;
  const mediaCount = event._count?.media ?? 0;

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.row}>
        {event.coverImageUrl ? (
          <Image source={{ uri: event.coverImageUrl }} style={styles.cover} />
        ) : (
          <View style={styles.coverFallback}>
            <Text style={styles.coverEmoji}>{eventTypeEmoji[event.type] ?? "✨"}</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {event.name}
          </Text>
          <Text style={styles.meta}>
            {formatDateRange(event.startDate, event.endDate)} · {memberCount} amis
            {mediaCount > 0 ? ` · ${mediaCount} médias` : ""}
          </Text>
          <View style={styles.footerRow}>
            <AvatarStack users={event.members.map((m) => m.user)} />
            <View style={styles.badgeGroup}>
              {event.status === "ACTIVE" && (
                <Text style={styles.countdown}>{formatCountdown(event.endDate)}</Text>
              )}
              <StatusBadge status={event.status} />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.9 },
  row: { flexDirection: "row" },
  cover: { width: 56, height: 56, borderRadius: radii.md, marginRight: spacing.md },
  coverFallback: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    marginRight: spacing.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  coverEmoji: { fontSize: 26 },
  info: { flex: 1, justifyContent: "space-between" },
  name: { ...typography.bodyBold, fontSize: 16, color: colors.text },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.sm },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badgeGroup: { alignItems: "flex-end", gap: 3 },
  countdown: { ...typography.caption, fontSize: 11, color: colors.textMuted },
});
