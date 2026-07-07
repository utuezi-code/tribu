import { Dimensions, FlatList, Image, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../theme/theme";
import type { Media } from "../types/models";

const GRID_GAP = 3;
const COLUMNS = 3;
const ITEM_SIZE = (Dimensions.get("window").width - spacing.md * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Aujourd'hui";
  if (sameDay(date, yesterday)) return "Hier";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function groupByDay(items: Media[]): Array<{ label: string; items: Media[] }> {
  const groups: Array<{ label: string; items: Media[] }> = [];
  for (const item of items) {
    const label = dayLabel(item.createdAt);
    const existing = groups.find((g) => g.label === label);
    if (existing) existing.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}

export function MediaGallery({
  media,
  onEndReached,
}: {
  media: Media[];
  onEndReached?: () => void;
}) {
  const groups = groupByDay(media);

  return (
    <FlatList
      data={groups}
      keyExtractor={(g) => g.label}
      contentContainerStyle={{ padding: spacing.md }}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      renderItem={({ item: group }) => (
        <View style={{ marginBottom: spacing.md }}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayLabel}>{group.label.toUpperCase()}</Text>
            <Text style={styles.dayMeta}>
              ajouté par {[...new Set(group.items.map((i) => i.user.displayName))].join(", ")}
            </Text>
          </View>
          <View style={styles.grid}>
            {group.items.map((item) => (
              <View key={item.id} style={{ width: ITEM_SIZE, height: ITEM_SIZE, marginBottom: GRID_GAP }}>
                <Image
                  source={{ uri: item.thumbnailUrl ?? item.storageUrl }}
                  style={styles.thumbnail}
                />
                {item.type === "VIDEO" && (
                  <View style={styles.videoBadge}>
                    <Text style={styles.videoBadgeText}>▶</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  dayHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  dayLabel: { ...typography.caption, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.5 },
  dayMeta: { ...typography.caption, color: colors.textMuted },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  thumbnail: { width: "100%", height: "100%", borderRadius: 6, backgroundColor: colors.primaryLight },
  videoBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  videoBadgeText: { color: "#fff", fontSize: 10 },
});
