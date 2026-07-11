import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radii, spacing } from "../theme/theme";

interface Props {
  onSend: (content: string) => void;
  onPickMedia: () => void;
}

export function ChatComposer({ onSend, onPickMedia }: Props) {
  const [text, setText] = useState("");

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={onPickMedia} style={styles.iconButton} hitSlop={8}>
        <Text style={styles.icon}>+</Text>
      </Pressable>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Message..."
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        multiline
      />
      <Pressable onPress={handleSend} style={styles.sendButton} hitSlop={8}>
        <Text style={styles.sendIcon}>{text.trim() ? "➤" : "🎤"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 20, color: colors.primary, fontWeight: "700" },
  input: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    color: colors.text,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: { fontSize: 18 },
});
