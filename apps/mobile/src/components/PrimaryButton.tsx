import { useRef } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text } from "react-native";
import { colors, radii, shadows, spacing, typography } from "../theme/theme";

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function PrimaryButton({ label, onPress, disabled, loading }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const isInactive = disabled || loading;

  function animateTo(value: number) {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        disabled={isInactive}
        onPressIn={() => !isInactive && animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        style={[styles.button, isInactive && styles.disabled]}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.label}>{label}</Text>}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.button,
  },
  disabled: { opacity: 0.45, shadowOpacity: 0 },
  label: { color: "#fff", ...typography.bodyBold, fontSize: 16 },
});
