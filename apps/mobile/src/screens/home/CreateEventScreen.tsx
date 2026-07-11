import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { eventsApi } from "../../api/events.api";
import { ApiError } from "../../api/client";
import { FormInput } from "../../components/FormInput";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, eventTypeEmoji, radii, spacing, typography } from "../../theme/theme";
import type { MainStackParamList } from "../../navigation/types";
import type { EventType } from "../../types/models";

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
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [friendPhones, setFriendPhones] = useState<string[]>([]);
  const [phoneInput, setPhoneInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datePickerTarget, setDatePickerTarget] = useState<"start" | "end" | null>(null);
  const insets = useSafeAreaInsets();

  const canSubmit = name.trim().length > 0 && endDate > startDate;

  function addFriend() {
    const trimmed = phoneInput.trim();
    if (!trimmed) return;
    setFriendPhones((prev) => [...prev, trimmed]);
    setPhoneInput("");
  }

  async function handleCreate() {
    setError(null);
    setLoading(true);
    try {
      const event = await eventsApi.create({
        type,
        name: name.trim(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        invitePhoneNumbers: friendPhones,
      });
      navigation.replace("EventDetail", { eventId: event.id });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible de créer l'événement.");
    } finally {
      setLoading(false);
    }
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

      <Text style={styles.label}>DATES</Text>
      <View style={styles.datesRow}>
        <Pressable style={styles.dateChip} onPress={() => setDatePickerTarget("start")}>
          <Text style={styles.dateChipText}>{formatShort(startDate)}</Text>
        </Pressable>
        <Text style={styles.arrow}>→</Text>
        <Pressable style={styles.dateChip} onPress={() => setDatePickerTarget("end")}>
          <Text style={styles.dateChipText}>{formatShort(endDate)}</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>
        La discussion se fige et la galerie s'archive automatiquement à minuit après la date de fin.
      </Text>

      {datePickerTarget && (
        <DateTimePicker
          value={datePickerTarget === "start" ? startDate : endDate}
          mode="date"
          minimumDate={datePickerTarget === "end" ? startDate : undefined}
          onChange={(_, selected) => {
            setDatePickerTarget(null);
            if (!selected) return;
            if (datePickerTarget === "start") {
              setStartDate(selected);
              if (endDate <= selected) {
                setEndDate(new Date(selected.getTime() + 24 * 60 * 60 * 1000));
              }
            } else {
              setEndDate(selected);
            }
          }}
        />
      )}

      <Text style={styles.label}>LES AMIS</Text>
      <View style={styles.friendsRow}>
        <FormInput
          value={phoneInput}
          onChangeText={setPhoneInput}
          placeholder="+33 6 ..."
          style={{ flex: 1, minWidth: 0 }}
          keyboardType="phone-pad"
          onSubmitEditing={addFriend}
        />
        <Pressable style={styles.inviteButton} onPress={addFriend}>
          <Text style={styles.inviteButtonLabel}>+ Inviter</Text>
        </Pressable>
      </View>
      {friendPhones.length > 0 && (
        <Text style={styles.friendsList}>{friendPhones.join(", ")}</Text>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={{ height: spacing.lg }} />
      <PrimaryButton label="Créer l'événement →" onPress={handleCreate} disabled={!canSubmit} loading={loading} />
      <View style={{ height: spacing.xl }} />
    </ScrollView>
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
  datesRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  dateChip: {
    flex: 1,
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dateChipText: { color: colors.text, ...typography.body },
  arrow: { color: colors.textMuted },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 18 },
  friendsRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  inviteButton: {
    height: 52,
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
  },
  inviteButtonLabel: { color: colors.primaryDark, fontWeight: "700" },
  friendsList: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.md },
});
