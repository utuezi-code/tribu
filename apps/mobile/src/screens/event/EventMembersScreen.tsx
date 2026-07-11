import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { eventsApi } from "../../api/events.api";
import { ApiError } from "../../api/client";
import { Avatar } from "../../components/Avatar";
import { useSessionStore } from "../../store/session.store";
import { colors, radii, spacing, typography } from "../../theme/theme";
import type { MainStackParamList } from "../../navigation/types";
import type { EventMembership, TribuEvent } from "../../types/models";

type Props = NativeStackScreenProps<MainStackParamList, "EventMembers">;

/** Organisateur d'abord, puis ordre alphabétique par prénom affiché. */
function sortMembers(members: EventMembership[]): EventMembership[] {
  return [...members].sort((a, b) => {
    if (a.role !== b.role) return a.role === "ORGANIZER" ? -1 : 1;
    return a.user.displayName.localeCompare(b.user.displayName, "fr");
  });
}

export function EventMembersScreen({ route, navigation }: Props) {
  const { eventId } = route.params;
  const currentUser = useSessionStore((s) => s.user);
  const [event, setEvent] = useState<TribuEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    try {
      const data = await eventsApi.get(eventId);
      setEvent(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible de charger les membres.");
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const members = event ? sortMembers(event.members) : [];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Membres</Text>
          {event && <Text style={styles.subtitle}>{event.name}</Text>}
        </View>
        <View style={{ width: 20 }} />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.md + insets.bottom }}
        ListHeaderComponent={
          members.length > 0 ? (
            <Text style={styles.count}>
              {members.length} {members.length > 1 ? "participants" : "participant"}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Avatar user={item.user} size={44} />
            <View style={styles.rowInfo}>
              <Text style={styles.name}>
                {item.user.displayName}
                {item.user.id === currentUser?.id ? " (toi)" : ""}
              </Text>
              <Text style={styles.phone}>{item.user.phoneNumber}</Text>
            </View>
            {item.role === "ORGANIZER" && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Organisateur</Text>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  back: { fontSize: 28, color: colors.text, width: 20 },
  headerInfo: { flex: 1, alignItems: "center" },
  title: { ...typography.bodyBold, fontSize: 16, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textSecondary },
  error: { ...typography.caption, color: colors.danger, padding: spacing.md },
  count: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowInfo: { flex: 1 },
  name: { ...typography.bodyBold, fontSize: 15, color: colors.text },
  phone: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  badge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: { ...typography.caption, color: colors.primaryDark, fontWeight: "700", fontSize: 11 },
});
