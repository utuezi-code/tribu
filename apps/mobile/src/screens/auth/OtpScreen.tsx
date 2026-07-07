import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { authApi } from "../../api/auth.api";
import { ApiError } from "../../api/client";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useSessionStore } from "../../store/session.store";
import { colors, radii, spacing, typography } from "../../theme/theme";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "OtpVerification">;
const CODE_LENGTH = 6;

export function OtpScreen({ route }: Props) {
  const { phoneNumber } = route.params;
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<Array<TextInput | null>>([]);
  const signIn = useSessionStore((s) => s.signIn);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const code = digits.join("");

  useEffect(() => {
    if (code.length === CODE_LENGTH) {
      void handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  function handleChangeDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    setError(null);
    setLoading(true);
    try {
      const { accessToken } = await authApi.verifyOtp(phoneNumber, code);
      await useSessionStore.getState().setAccessTokenOnly(accessToken);
      const me = await authApi.me();
      await signIn(accessToken, me);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur de vérification, réessaie.");
      setDigits(Array(CODE_LENGTH).fill(""));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setSecondsLeft(30);
    await authApi.requestOtp(phoneNumber).catch(() => undefined);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Entre le code</Text>
      <Text style={styles.subtitle}>Envoyé par SMS au {phoneNumber}</Text>

      <View style={styles.digitsRow}>
        {digits.map((digit, i) => (
          <TextInput
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            value={digit}
            onChangeText={(v) => handleChangeDigit(i, v)}
            onKeyPress={(e) => handleKeyPress(i, e.nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={1}
            style={[styles.digitBox, digit ? styles.digitBoxFilled : undefined]}
            autoFocus={i === 0}
          />
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable disabled={secondsLeft > 0} onPress={handleResend} style={{ marginTop: spacing.lg }}>
        <Text style={styles.resend}>
          {secondsLeft > 0 ? `Renvoyer le code 0:${secondsLeft.toString().padStart(2, "0")}` : "Renvoyer le code"}
        </Text>
      </Pressable>

      <View style={{ flex: 1 }} />
      <PrimaryButton
        label="Confirmer"
        onPress={handleVerify}
        disabled={code.length !== CODE_LENGTH}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0B1E", padding: spacing.lg, paddingTop: spacing.xl * 2 },
  title: { ...typography.title, color: "#fff" },
  subtitle: { ...typography.body, color: "#A9A3C2", marginTop: spacing.xs },
  digitsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl },
  digitBox: {
    width: 44,
    height: 52,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: "#332C4D",
    backgroundColor: "#1B1630",
    color: "#fff",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
  digitBoxFilled: { borderColor: colors.primary },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.md },
  resend: { ...typography.body, color: "#A9A3C2" },
});
