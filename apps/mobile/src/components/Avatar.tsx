import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/theme";
import type { User } from "../types/models";

function colorForUser(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return colors.avatarPalette[Math.abs(hash) % colors.avatarPalette.length];
}

export function Avatar({ user, size = 32 }: { user: User; size?: number }) {
  const initial = user.displayName.trim().charAt(0).toUpperCase() || "?";

  if (user.avatarUrl) {
    return (
      <Image
        source={{ uri: user.avatarUrl }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colorForUser(user.id) },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.45 }]}>{initial}</Text>
    </View>
  );
}

/** Petite pile d'avatars superposés, utilisée pour les listes de participants. */
export function AvatarStack({ users, max = 4 }: { users: User[]; max?: number }) {
  const visible = users.slice(0, max);
  const extra = users.length - visible.length;

  return (
    <View style={styles.stack}>
      {visible.map((u, i) => (
        <View key={u.id} style={[styles.stackItem, { marginLeft: i === 0 ? 0 : -10, zIndex: max - i }]}>
          <Avatar user={u} size={28} />
        </View>
      ))}
      {extra > 0 && (
        <View style={[styles.stackItem, styles.extraBubble, { marginLeft: -10 }]}>
          <Text style={styles.extraText}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { resizeMode: "cover" },
  fallback: { alignItems: "center", justifyContent: "center" },
  initial: { color: "#fff", fontWeight: "700" },
  stack: { flexDirection: "row", alignItems: "center" },
  stackItem: { borderWidth: 2, borderColor: colors.surface, borderRadius: 999 },
  extraBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  extraText: { color: colors.primary, fontSize: 11, fontWeight: "700" },
});
