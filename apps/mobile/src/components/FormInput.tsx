import { useState } from "react";
import { StyleSheet, TextInput, type TextInputProps, type TextStyle } from "react-native";
import { colors, radii, spacing, typography } from "../theme/theme";

/**
 * RN Web applique un anneau de focus natif du navigateur (carré, décalé du
 * borderRadius) qui rendait le champ "bizarre" en plus de notre propre style
 * de focus. `outlineStyle` n'existe pas dans les types RN standards (c'est
 * une extension web-only de react-native-web) : cast isolé plutôt que
 * d'affaiblir le typage du reste du composant.
 */
const webNoOutline = { outlineStyle: "none" } as unknown as TextStyle;

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
