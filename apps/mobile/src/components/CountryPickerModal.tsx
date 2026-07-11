import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FormInput } from "./FormInput";
import { colors, radii, spacing, typography } from "../theme/theme";
import { haptics } from "../utils/haptics";
import { searchCountries, type Country } from "../utils/countries";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: Country) => void;
}

export function CountryPickerModal({ visible, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const results = searchCountries(query);
  const insets = useSafeAreaInsets();

  function handleClose() {
    setQuery("");
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: spacing.md + insets.bottom }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>Choisis ton pays</Text>

          <FormInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un pays ou un indicatif"
            style={styles.search}
            autoFocus
          />

          <FlatList
            data={results}
            keyExtractor={(c) => c.code}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={styles.empty}>Aucun pays trouvé.</Text>}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => {
                  haptics.tap();
                  onSelect(item);
                  handleClose();
                }}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.dialCode}>{item.dialCode}</Text>
              </Pressable>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlayDark, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    maxHeight: "75%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  title: { ...typography.heading, color: colors.text, marginBottom: spacing.md },
  search: { marginBottom: spacing.sm },
  empty: { ...typography.body, color: colors.textMuted, textAlign: "center", paddingVertical: spacing.lg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  rowPressed: { opacity: 0.6 },
  flag: { fontSize: 22 },
  countryName: { flex: 1, ...typography.body, color: colors.text },
  dialCode: { ...typography.body, color: colors.textMuted },
});
