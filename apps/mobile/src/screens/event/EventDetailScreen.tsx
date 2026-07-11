import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { eventsApi } from "../../api/events.api";
import { messagesApi } from "../../api/messages.api";
import { mediaApi } from "../../api/media.api";
import { ApiError } from "../../api/client";
import { useRealtimeEvent } from "../../api/useRealtimeEvent";
import { AvatarStack } from "../../components/Avatar";
import { ChatComposer } from "../../components/ChatComposer";
import { MediaGallery } from "../../components/MediaGallery";
import { MessageBubble } from "../../components/MessageBubble";
import { StatusBadge } from "../../components/StatusBadge";
import { enqueueMessage, onQueueSettled } from "../../offline/messageQueue";
import { pickAndUploadMedia } from "../../offline/mediaUpload";
import { useSessionStore } from "../../store/session.store";
import { colors, spacing, typography } from "../../theme/theme";
import { daysUntil, formatCountdown } from "../../utils/countdown";
import type { MainStackParamList } from "../../navigation/types";
import type { Media, Message, TribuEvent } from "../../types/models";

type Props = NativeStackScreenProps<MainStackParamList, "EventDetail">;
type Tab = "discussion" | "gallery";

function formatDateRange(startDate: string, endDate: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${new Date(startDate).toLocaleDateString("fr-FR", opts)} – ${new Date(endDate).toLocaleDateString("fr-FR", opts)}`;
}

export function EventDetailScreen({ route, navigation }: Props) {
  const { eventId } = route.params;
  const currentUser = useSessionStore((s) => s.user);
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<TribuEvent | null>(null);
  const [tab, setTab] = useState<Tab>("discussion");
  const [messages, setMessages] = useState<Message[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [savingDate, setSavingDate] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  const loadEvent = useCallback(async () => {
    try {
      const data = await eventsApi.get(eventId);
      setEvent(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible de charger l'événement.");
    }
  }, [eventId]);

  const loadMessages = useCallback(async () => {
    try {
      const data = await messagesApi.list(eventId);
      setMessages(data.reverse());
    } catch {
      // La liste des messages en cache local reste affichée ; pas d'écrasement silencieux nécessaire ici.
    }
  }, [eventId]);

  const loadMedia = useCallback(async () => {
    try {
      const data = await mediaApi.list(eventId);
      setMedia(data);
    } catch {
      /* voir loadMessages */
    }
  }, [eventId]);

  useEffect(() => {
    loadEvent();
    loadMessages();
    loadMedia();
  }, [loadEvent, loadMessages, loadMedia]);

  useEffect(() => onQueueSettled((settledEventId) => {
    if (settledEventId === eventId) loadMessages();
  }), [eventId, loadMessages]);

  useRealtimeEvent(eventId, useCallback(() => {
    loadMessages();
    loadMedia();
  }, [loadMessages, loadMedia]));

  if (!event) {
    return (
      <View style={styles.loading}>
        {error ? <Text style={styles.errorText}>{error}</Text> : <Text>Chargement...</Text>}
      </View>
    );
  }

  const isArchived = event.status === "ARCHIVED";
  const isGracePeriod = event.status === "GRACE_PERIOD";
  const isLocked = event.status !== "ACTIVE"; // discussion figée dès la date de fin (GRACE_PERIOD inclus)
  const isOrganizer = event.members.some(
    (m) => m.userId === currentUser?.id && m.role === "ORGANIZER",
  );
  // Le report de date n'est autorisé que tant que l'événement est actif
  // (la discussion figée/l'archivage ne doivent pas être "annulés" a posteriori).
  const canEditEndDate = isOrganizer && event.status === "ACTIVE";

  async function handleSend(content: string) {
    const optimistic = await enqueueMessage(eventId, content);
    setMessages((prev) => [...prev, optimistic]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }

  async function handlePickMedia() {
    try {
      const uploaded = await pickAndUploadMedia(eventId);
      if (uploaded) setMedia((prev) => [uploaded, ...prev]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Échec de l'envoi du média. Réessaie.");
    }
  }

  async function handleUpdateEndDate(selected: Date) {
    setSavingDate(true);
    setError(null);
    try {
      const updated = await eventsApi.update(eventId, { endDate: selected.toISOString() });
      setEvent(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible de mettre à jour la date.");
    } finally {
      setSavingDate(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Pressable
          style={styles.headerInfo}
          onPress={() => navigation.navigate("EventMembers", { eventId })}
        >
          <Text style={styles.eventName} numberOfLines={1}>{event.name}</Text>
          <View style={styles.eventMetaRow}>
            <Text style={styles.eventMeta} numberOfLines={1}>
              {event.members.length} amis · {formatDateRange(event.startDate, event.endDate)}
            </Text>
            {canEditEndDate && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setDatePickerVisible(true);
                }}
                disabled={savingDate}
                hitSlop={8}
              >
                <Text style={styles.editDateLink}>{savingDate ? "..." : "Modifier"}</Text>
              </Pressable>
            )}
          </View>
          {event.status === "ACTIVE" && (
            <Text style={styles.countdown}>⏳ {formatCountdown(event.endDate)}</Text>
          )}
        </Pressable>
        <Pressable onPress={() => navigation.navigate("EventMembers", { eventId })} hitSlop={8}>
          <AvatarStack users={event.members.map((m) => m.user)} max={3} />
        </Pressable>
      </View>

      {datePickerVisible && (
        <DateTimePicker
          value={new Date(event.endDate)}
          mode="date"
          minimumDate={new Date()}
          onChange={(_, selected) => {
            setDatePickerVisible(false);
            if (selected) handleUpdateEndDate(selected);
          }}
        />
      )}

      {isArchived && (
        <View style={styles.archivedBanner}>
          <StatusBadge status="ARCHIVED" />
          <Text style={styles.archivedText}>
            Archivé automatiquement, les souvenirs restent ici 💜
          </Text>
        </View>
      )}

      {isGracePeriod && (
        <View style={styles.graceBanner}>
          <Text style={styles.graceText}>
            🔒 La discussion est figée. La galerie reste ouverte 48h de plus pour ajouter vos
            dernières photos, puis l'événement s'archive définitivement.
          </Text>
        </View>
      )}

      {event.status === "ACTIVE" && daysUntil(event.endDate) <= 1 && (
        <View style={styles.soonBanner}>
          <Text style={styles.soonText}>
            ⏳ {formatCountdown(event.endDate)} : profitez des derniers échanges avant que la
            discussion ne se fige !
          </Text>
        </View>
      )}

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === "discussion" && styles.tabActive]} onPress={() => setTab("discussion")}>
          <Text style={[styles.tabLabel, tab === "discussion" && styles.tabLabelActive]}>Discussion</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === "gallery" && styles.tabActive]} onPress={() => setTab("gallery")}>
          <Text style={[styles.tabLabel, tab === "gallery" && styles.tabLabelActive]}>
            Galerie · {media.length}
          </Text>
        </Pressable>
      </View>

      {tab === "discussion" ? (
        <>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <MessageBubble message={item} isMine={item.userId === currentUser?.id} />
            )}
            contentContainerStyle={{ paddingVertical: spacing.md }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />
          {isLocked ? (
            <View style={[styles.lockedNotice, { paddingBottom: spacing.md + insets.bottom }]}>
              <Text style={styles.lockedText}>
                🔒 Cet événement est {isArchived ? "archivé" : "en cours de clôture"} : la discussion est figée en lecture seule.
              </Text>
            </View>
          ) : (
            <View style={{ paddingBottom: insets.bottom, backgroundColor: colors.surface }}>
              <ChatComposer onSend={handleSend} onPickMedia={handlePickMedia} />
            </View>
          )}
        </>
      ) : (
        <>
          <MediaGallery media={media} onEndReached={loadMedia} />
          {!isArchived && (
            <Pressable
              style={[styles.addMediaButton, { bottom: spacing.lg + insets.bottom }]}
              onPress={handlePickMedia}
            >
              <Text style={styles.addMediaLabel}>+ Ajouter des photos</Text>
            </Pressable>
          )}
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  errorText: { color: colors.danger, ...typography.body },
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
  headerInfo: { flex: 1 },
  eventName: { ...typography.bodyBold, fontSize: 16, color: colors.text },
  eventMetaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  eventMeta: { ...typography.caption, color: colors.textSecondary, flexShrink: 1 },
  editDateLink: { ...typography.caption, color: colors.primaryDark, fontWeight: "700" },
  countdown: { ...typography.caption, color: colors.planning, fontWeight: "700", marginTop: 2 },
  archivedBanner: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.xs,
  },
  archivedText: { ...typography.caption, color: colors.primaryDark, textAlign: "center" },
  graceBanner: { backgroundColor: colors.planningLight, padding: spacing.md },
  graceText: { ...typography.caption, color: colors.planning, textAlign: "center", lineHeight: 18 },
  soonBanner: { backgroundColor: colors.planningLight, padding: spacing.sm + 2 },
  soonText: { ...typography.caption, color: colors.planning, textAlign: "center", lineHeight: 18 },
  tabs: { flexDirection: "row", backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: 999, alignItems: "center", backgroundColor: colors.background },
  tabActive: { backgroundColor: colors.text },
  tabLabel: { ...typography.bodyBold, fontSize: 13, color: colors.textSecondary },
  tabLabelActive: { color: "#fff" },
  lockedNotice: { padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  lockedText: { ...typography.caption, color: colors.textMuted, textAlign: "center" },
  addMediaButton: {
    position: "absolute",
    bottom: spacing.lg,
    alignSelf: "center",
    backgroundColor: colors.text,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  addMediaLabel: { color: "#fff", ...typography.bodyBold, fontSize: 13 },
});
