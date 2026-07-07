import { Image, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "../theme/theme";
import type { Message } from "../types/models";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  return (
    <View style={[styles.row, isMine && styles.rowMine]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        {!isMine && <Text style={styles.author}>{message.user.displayName}</Text>}

        {message.media.map((m) => (
          <Image key={m.id} source={{ uri: m.thumbnailUrl ?? m.storageUrl }} style={styles.mediaPreview} />
        ))}

        {message.content ? (
          <Text style={[styles.content, isMine && styles.contentMine]}>{message.content}</Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={[styles.time, isMine && styles.timeMine]}>{formatTime(message.createdAt)}</Text>
          {isMine && message.clientState === "sending" && <Text style={styles.status}>⏳</Text>}
          {isMine && message.clientState === "failed" && <Text style={styles.statusFailed}>⚠️</Text>}
          {isMine && (!message.clientState || message.clientState === "sent") && (
            <Text style={styles.status}>✓</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", marginVertical: spacing.xs, paddingHorizontal: spacing.md },
  rowMine: { justifyContent: "flex-end" },
  bubble: { maxWidth: "78%", borderRadius: radii.lg, padding: spacing.sm + 2 },
  bubbleTheirs: { backgroundColor: colors.bubbleReceived, borderTopLeftRadius: 4 },
  bubbleMine: { backgroundColor: colors.bubbleSent, borderTopRightRadius: 4 },
  author: { ...typography.caption, fontWeight: "700", color: colors.primary, marginBottom: 2 },
  content: { ...typography.body, color: colors.text },
  contentMine: { color: "#fff" },
  mediaPreview: { width: 180, height: 130, borderRadius: radii.md, marginBottom: spacing.xs },
  metaRow: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginTop: 2, gap: 4 },
  time: { fontSize: 11, color: colors.textMuted },
  timeMine: { color: "rgba(255,255,255,0.75)" },
  status: { fontSize: 11, color: "rgba(255,255,255,0.75)" },
  statusFailed: { fontSize: 11 },
});
