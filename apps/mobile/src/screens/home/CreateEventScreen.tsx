import { useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { eventsApi } from "../../api/events.api";
import { ApiError } from "../../api/client";
import { FormInput } from "../../components/FormInput";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, eventTypeEmoji, radii, spacing, typography } from "../../theme/theme";
import { buildInviteLink } from "../../utils/inviteLink";
import { haptics } from "../../utils/haptics";
import type { MainStackParamList } from "../../navigation/types";
import type { EventType, TribuEvent } from "../../types/models";

type Props = NativeStackScreenProps<MainStackParamList, "CreateEvent">;

const TYPES: EventType[] = ["VOYAGE", "MARIAGE", "ANNIVERSAIRE", "SOIREE"];
const TYPE_LABELS: Record<EventType, string> = {
  VOYAGE: "Voyage",
  MARIAGE: "Mariage",
  ANNIVERSAIRE: "Anniv",
  SOIREE: "Soirée",
  AUTRE: "Autre",
};

function formatShort(date: Date) {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function CreateEventScreen({ navigation }: Props) {
  const [type, setType] = useState<EventType>("VOYAGE");
  const [name, setName] = useState("");
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<TribuEvent | null>(null);
  const insets = useSafeAreaInsets();

  const canSubmit = name.trim().length > 0 && endDate > new Date();

  async function handleCreate() {
    setError(null);
    setLoading(true);
    try {
      const event = await eventsApi.create({
        type,
        name: name.trim(),
        endDate: endDate.toISOString(),
      });
      setCreatedEvent(event);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible de créer l'événement.");
    } finally {
      setLoading(false);
    }
  }

  if (createdEvent) {
    return (
      <InviteShareStep
        event={createdEvent}
        insetsBottom={insets.bottom}
        onContinue={() => navigation.replace("EventDetail", { eventId: createdEvent.id })}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        padding: spacing.lg,
        paddingTop: spacing.lg + insets.top,
        paddingBottom: spacing.lg + insets.bottom,
      }}
    >
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <Text style={styles.title}>Nouvel événement</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.label}>TYPE D'ÉVÉNEMENT</Text>
      <View style={styles.typeRow}>
        {TYPES.map((t) => (
          <Pressable
            key={t}
            onPress={() => setType(t)}
            style={[styles.typeCard, type === t && styles.typeCardSelected]}
          >
            <Text style={styles.typeEmoji}>{eventTypeEmoji[t]}</Text>
            <Text style={[styles.typeLabel, type === t && styles.typeLabelSelected]}>
              {TYPE_LABELS[t]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>NOM</Text>
      <FormInput value={name} onChangeText={setName} placeholder="Road-trip Portugal" />

      <Text style={styles.label}>JUSQU'À QUAND ?</Text>
      <Pressable style={styles.dateChip} onPress={() => setDatePickerVisible(true)}>
        <Text style={styles.dateChipText}>{formatShort(endDate)}</Text>
      </Pressable>
      <Text style={styles.hint}>
        L'événement commence maintenant. La discussion se fige et la galerie s'archive
        automatiquement à minuit après cette date.
      </Text>

      {datePickerVisible && (
        <DateTimePicker
          value={endDate}
          mode="date"
          minimumDate={new Date()}
          onChange={(_, selected) => {
            setDatePickerVisible(false);
            if (selected) setEndDate(selected);
          }}
        />
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={{ height: spacing.lg }} />
      <PrimaryButton label="Créer l'événement →" onPress={handleCreate} disabled={!canSubmit} loading={loading} />
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

function InviteShareStep({
  event,
  insetsBottom,
  onContinue,
}: {
  event: TribuEvent;
  insetsBottom: number;
  onContinue: () => void;
}) {
  const link = buildInviteLink(event.inviteCode);
  const [shareError, setShareError] = useState<string | null>(null);

  async function handleShare() {
    haptics.tap();
    setShareError(null);
    try {
      // Résout avec { action: Share.dismissedAction } en cas d'annulation
      // (pas une erreur) : seul un vrai rejet de promesse doit être signalé.
      await Share.share({
        message: `Rejoins "${event.name}" sur Tribu ! Ouvre l'app et utilise le code ${event.inviteCode}, ou ce lien si tu as déjà l'app : ${link}`,
      });
    } catch {
      setShareError("Impossible d'ouvrir le partage. Le code reste affiché ci-dessous.");
    }
  }

  return (
    <View style={[styles.shareContainer, { paddingBottom: spacing.lg + insetsBottom }]}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={styles.shareEmoji}>🎉</Text>
        <Text style={styles.shareTitle}>Événement créé !</Text>
        <Text style={styles.shareSubtitle}>
          Partage ce lien avec tes amis pour qu'ils rejoignent "{event.name}".
        </Text>

        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>CODE D'INVITATION</Text>
          <Text style={styles.codeValue}>{event.inviteCode}</Text>
        </View>

        <PrimaryButton label="Partager le lien →" onPress={handleShare} />
        {shareError && <Text style={styles.error}>{shareError}</Text>}
      </View>

      <Pressable onPress={onContinue} style={styles.continueLink}>
        <Text style={styles.continueLinkText}>Aller à l'événement</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  close: { fontSize: 18, color: colors.textSecondary },
  title: { ...typography.heading, color: colors.text },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
    fontWeight: "700",
  },
  typeRow: { flexDirection: "row", gap: spacing.sm },
  typeCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  typeCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  typeEmoji: { fontSize: 22, marginBottom: spacing.xs },
  typeLabel: { ...typography.caption, color: colors.textSecondary },
  typeLabelSelected: { color: colors.primaryDark, fontWeight: "700" },
  dateChip: {
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dateChipText: { color: colors.text, ...typography.body },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 18 },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.md },
  shareContainer: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  shareEmoji: { fontSize: 56, marginBottom: spacing.md },
  shareTitle: { ...typography.title, fontSize: 24, color: colors.text, marginBottom: spacing.sm },
  shareSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  codeBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  codeLabel: { ...typography.caption, color: colors.textMuted, letterSpacing: 1, fontWeight: "700" },
  codeValue: { ...typography.title, fontSize: 26, color: colors.primaryDark, letterSpacing: 2, marginTop: spacing.xs },
  continueLink: { alignItems: "center", paddingVertical: spacing.md },
  continueLinkText: { ...typography.bodyBold, color: colors.textSecondary },
});
