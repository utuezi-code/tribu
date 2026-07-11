import { useState } from "react";
import { StyleSheet, TextInput, type TextInputProps } from "react-native";
import { colors, radii, spacing, typography } from "../theme/theme";
import { webNoOutline } from "../utils/webStyles";

export function FormInput({ style, onFocus, onBlur, ...rest }: TextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      {...rest}
      placeholderTextColor={rest.placeholderTextColor ?? colors.textMuted}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[styles.base, focused && styles.focused, style, webNoOutline]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    ...typography.body,
    fontSize: 16,
    color: colors.text,
  },
  focused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
});
