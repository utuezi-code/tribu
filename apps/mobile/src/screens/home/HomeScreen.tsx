import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { eventsApi } from "../../api/events.api";
import { ApiError } from "../../api/client";
import { EventCard } from "../../components/EventCard";
import { FormInput } from "../../components/FormInput";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, radii, spacing, typography } from "../../theme/theme";
import type { MainStackParamList } from "../../navigation/types";
import type { TribuEvent } from "../../types/models";

type Props = NativeStackScreenProps<MainStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const [events, setEvents] = useState<TribuEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await eventsApi.list();
      setEvents(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible de charger tes événements.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", load);
    return unsubscribe;
  }, [navigation, load]);

  const active = events.filter((e) => e.status !== "ARCHIVED");
  const archived = events.filter((e) => e.status === "ARCHIVED");

  const sections = [
    { title: "ACTIFS", data: active },
    { title: "ARCHIVÉS", data: archived },
  ].filter((s) => s.data.length > 0);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Tes événements</Text>
        <Pressable style={styles.fab} onPress={() => navigation.navigate("CreateEvent")}>
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => setJoinModalVisible(true)} style={styles.joinLink}>
        <Text style={styles.joinLinkText}>J'ai un code d'invitation</Text>
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}

      {!loading && events.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Aucun événement pour l'instant</Text>
          <Text style={styles.emptySubtitle}>Crée ton premier événement pour commencer à planifier avec tes amis.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
          renderItem={({ item }) => (
            <EventCard event={item} onPress={() => navigation.navigate("EventDetail", { eventId: item.id })} />
          )}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 + insets.bottom }}
        />
      )}

      <Pressable
        style={[styles.createButton, { bottom: spacing.lg + insets.bottom }]}
        onPress={() => navigation.navigate("CreateEvent")}
      >
        <Text style={styles.createButtonLabel}>+ Nouvel événement</Text>
      </Pressable>

      <JoinByCodeModal
        visible={joinModalVisible}
        onClose={() => setJoinModalVisible(false)}
        onJoined={(eventId) => {
          setJoinModalVisible(false);
          navigation.navigate("EventDetail", { eventId });
        }}
      />
    </View>
  );
}

function JoinByCodeModal({
  visible,
  onClose,
  onJoined,
}: {
  visible: boolean;
  onClose: () => void;
  onJoined: (eventId: string) => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  function handleClose() {
    setCode("");
    setError(null);
    onClose();
  }

  async function handleJoin() {
    const trimmed = code.trim();
    if (!trimmed) return;
    setError(null);
    setLoading(true);
    try {
      const event = await eventsApi.joinByInviteCode(trimmed);
      setCode("");
      onJoined(event.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Code d'invitation invalide.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.modalBackdrop} onPress={handleClose}>
        <Pressable
          style={[styles.modalSheet, { paddingBottom: spacing.lg + insets.bottom }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Rejoindre un événement</Text>
          <Text style={styles.modalSubtitle}>Entre le code d'invitation partagé par l'organisateur.</Text>

          <FormInput
            value={code}
            onChangeText={setCode}
            placeholder="Ex : ABC123"
            autoCapitalize="characters"
            style={{ marginBottom: spacing.md }}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <PrimaryButton label="Rejoindre" onPress={handleJoin} disabled={!code.trim()} loading={loading} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  title: { ...typography.title, color: colors.text },
  fab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  fabIcon: { color: "#fff", fontSize: 22, marginTop: -2 },
  joinLink: { paddingHorizontal: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.sm },
  joinLinkText: { ...typography.caption, color: colors.primaryDark, fontWeight: "700" },
  sectionHeader: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  error: { ...typography.caption, color: colors.danger, paddingHorizontal: spacing.md },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  emptyTitle: { ...typography.heading, color: colors.text, marginBottom: spacing.sm },
  emptySubtitle: { ...typography.body, color: colors.textSecondary, textAlign: "center" },
  createButton: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  createButtonLabel: { color: "#fff", ...typography.bodyBold, fontSize: 16 },
  modalBackdrop: { flex: 1, backgroundColor: colors.overlayDark, justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  modalTitle: { ...typography.heading, color: colors.text, marginBottom: spacing.xs },
  modalSubtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
});
