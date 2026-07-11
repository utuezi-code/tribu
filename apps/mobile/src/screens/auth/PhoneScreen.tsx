import { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { authApi } from "../../api/auth.api";
import { ApiError } from "../../api/client";
import { CountryPickerModal } from "../../components/CountryPickerModal";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, radii, shadows, spacing, typography } from "../../theme/theme";
import { DEFAULT_COUNTRY, formatPhoneForDisplay, type Country } from "../../utils/countries";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Phone">;

export function PhoneScreen({ navigation }: Props) {
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState("");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, [cardAnim]);

  const digits = phone.replace(/\D/g, "");
  const canSubmit = digits.length >= 6;

  async function handleSubmit() {
    setError(null);
    const phoneNumber = `${country.dialCode}${digits}`;
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
    <View style={styles.container}>
      <LinearGradient colors={colors.gradientAuth} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.heroGlow} />
        <View style={styles.logo}>
          <Text style={styles.logoEmoji}>☁️</Text>
        </View>
        <Text style={styles.brand}>Tribu</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={40}
      >
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardAnim,
              transform: [
                { translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
              ],
            },
          ]}
        >
          <Text style={styles.title}>Bienvenue 👋</Text>
          <Text style={styles.subtitle}>
            Planifiez à plusieurs. Gardez tous vos souvenirs au même endroit.
          </Text>

          <Text style={styles.label}>TON NUMÉRO DE TÉLÉPHONE</Text>
          <View style={styles.phoneRow}>
            <Pressable style={styles.countryPill} onPress={() => setPickerVisible(true)}>
              <Text style={styles.flag}>{country.flag}</Text>
              <Text style={styles.dialCode}>{country.dialCode}</Text>
              <Text style={styles.chevron}>▾</Text>
            </Pressable>
            <TextInput
              value={phone}
              onChangeText={(v) => setPhone(formatPhoneForDisplay(v))}
              placeholder="6 12 34 56 78"
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
            En continuant, tu acceptes les <Text style={styles.legalLink}>Conditions d'utilisation</Text> et la{" "}
            <Text style={styles.legalLink}>Politique de confidentialité</Text>.
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>

      <CountryPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={setCountry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gradientAuth[2] },
  flex: { flex: 1 },
  hero: {
    height: "38%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(255,255,255,0.12)",
    top: -80,
    right: -60,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radii.xl,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  logoEmoji: { fontSize: 34 },
  brand: { ...typography.title, fontSize: 30, color: "#fff", letterSpacing: 0.3 },
  card: {
    flex: 1,
    marginTop: -spacing.xl,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.soft,
  },
  title: { ...typography.title, fontSize: 24, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  label: { ...typography.caption, color: colors.textMuted, letterSpacing: 0.5, marginBottom: spacing.sm, fontWeight: "700" },
  phoneRow: { flexDirection: "row", gap: spacing.sm },
  countryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm + 2,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  flag: { fontSize: 18 },
  dialCode: { ...typography.bodyBold, color: colors.text },
  chevron: { color: colors.textMuted, fontSize: 12, marginLeft: 2 },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...typography.bodyBold,
    fontSize: 17,
    color: colors.text,
  },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
  legal: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.md,
    lineHeight: 18,
  },
  legalLink: { color: colors.primaryDark, fontWeight: "600" },
});
