import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { authApi } from "../../api/auth.api";
import { ApiError } from "../../api/client";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, radii, spacing, typography } from "../../theme/theme";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Phone">;

export function PhoneScreen({ navigation }: Props) {
  const [countryCode, setCountryCode] = useState("+33");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = phone.trim().length >= 6;

  async function handleSubmit() {
    setError(null);
    const phoneNumber = `${countryCode}${phone.replace(/\D/g, "")}`;
    setLoading(true);
    try {
      await authApi.requestOtp(phoneNumber);
      navigation.navigate("OtpVerification", { phoneNumber });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible d'envoyer le code. Vérifie ta connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoEmoji}>☁️</Text>
        </View>
        <Text style={styles.title}>Tribu</Text>
        <Text style={styles.subtitle}>Planifiez à plusieurs. Gardez tous vos souvenirs au même endroit.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>TON NUMÉRO DE TÉLÉPHONE</Text>
        <View style={styles.phoneRow}>
          <View style={styles.countryPill}>
            <Text>🇫🇷</Text>
            <TextInput
              value={countryCode}
              onChangeText={setCountryCode}
              style={styles.countryInput}
              keyboardType="phone-pad"
            />
          </View>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="6 12 34 56"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            style={styles.phoneInput}
            autoFocus
          />
        </View>
        <Text style={styles.hint}>On t'envoie un code par SMS. Pas de mot de passe, pas d'e-mail.</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={{ height: spacing.lg }} />
        <PrimaryButton
          label="Recevoir le code →"
          onPress={handleSubmit}
          disabled={!canSubmit}
          loading={loading}
        />

        <Text style={styles.legal}>
          En continuant, tu acceptes les Conditions d'utilisation et la Politique de confidentialité.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: spacing.xl },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  logoEmoji: { fontSize: 30 },
  title: { ...typography.title, color: colors.text },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  form: {},
  label: { ...typography.caption, color: colors.textMuted, letterSpacing: 0.5, marginBottom: spacing.sm },
  phoneRow: { flexDirection: "row", gap: spacing.sm },
  countryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countryInput: { width: 44, ...typography.body, color: colors.text },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body,
    color: colors.text,
  },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
  legal: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
