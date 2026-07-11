import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { authApi } from "../../api/auth.api";
import { ApiError } from "../../api/client";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useSessionStore } from "../../store/session.store";
import { colors, radii, spacing, typography } from "../../theme/theme";
import { haptics } from "../../utils/haptics";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "OtpVerification">;
const CODE_LENGTH = 6;

export function OtpScreen({ route, navigation }: Props) {
  const { phoneNumber } = route.params;
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<Array<TextInput | null>>([]);
  const shake = useRef(new Animated.Value(0)).current;
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

  function playShake() {
    shake.setValue(0);
    Animated.sequence(
      [10, -10, 8, -8, 4, 0].map((v) =>
        Animated.timing(shake, { toValue: v, duration: 45, useNativeDriver: true }),
      ),
    ).start();
  }

  function handleChangeDigit(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "");

    // Collage ou autofill SMS natif (iOS/Android déposent parfois le code
    // entier dans la case focalisée) : on répartit les chiffres au lieu de
    // ne garder que le dernier caractère.
    if (cleaned.length > 1) {
      const next = [...digits];
      let lastIndex = index;
      for (let i = 0; i < cleaned.length && index + i < CODE_LENGTH; i++) {
        next[index + i] = cleaned[i] ?? "";
        lastIndex = index + i;
      }
      setDigits(next);
      haptics.tap();
      if (lastIndex < CODE_LENGTH - 1) {
        inputs.current[lastIndex + 1]?.focus();
      } else {
        inputs.current[lastIndex]?.blur();
      }
      return;
    }

    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned) {
      haptics.tap();
      if (index < CODE_LENGTH - 1) {
        inputs.current[index + 1]?.focus();
      }
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
      haptics.success();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur de vérification, réessaie.");
      setDigits(Array(CODE_LENGTH).fill(""));
      playShake();
      haptics.error();
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
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={8}>
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>

      <View style={styles.stepsRow}>
        <View style={styles.stepDotDone} />
        <View style={styles.stepDotActive} />
      </View>

      <Text style={styles.title}>Entre le code</Text>
      <Text style={styles.subtitle}>Envoyé par SMS au {phoneNumber}</Text>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.editNumber}>Modifier le numéro</Text>
      </Pressable>

      <Animated.View style={[styles.digitsRow, { transform: [{ translateX: shake }] }]}>
        {digits.map((digit, i) => (
          <TextInput
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            value={digit}
            onChangeText={(v) => handleChangeDigit(i, v)}
            onKeyPress={(e) => handleKeyPress(i, e.nativeEvent.key)}
            onFocus={() => setFocusedIndex(i)}
            onBlur={() => setFocusedIndex((prev) => (prev === i ? null : prev))}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={i === 0 ? CODE_LENGTH : 1}
            style={[
              styles.digitBox,
              digit ? styles.digitBoxFilled : undefined,
              focusedIndex === i ? styles.digitBoxFocused : undefined,
            ]}
            autoFocus={i === 0}
          />
        ))}
      </Animated.View>

      {error && <Text style={styles.error}>⚠ {error}</Text>}

      <Pressable disabled={secondsLeft > 0} onPress={handleResend} style={styles.resendPill}>
        <Text style={[styles.resend, secondsLeft <= 0 && styles.resendActive]}>
          {secondsLeft > 0 ? `Renvoyer le code · 0:${secondsLeft.toString().padStart(2, "0")}` : "Renvoyer le code"}
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
  container: { flex: 1, backgroundColor: "#0F0B1E", padding: spacing.lg, paddingTop: spacing.xl * 1.5 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1B1630",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  backIcon: { color: "#fff", fontSize: 22, marginTop: -2 },
  stepsRow: { flexDirection: "row", gap: 6, marginBottom: spacing.md },
  stepDotDone: { width: 20, height: 4, borderRadius: 2, backgroundColor: "#4A4166" },
  stepDotActive: { width: 28, height: 4, borderRadius: 2, backgroundColor: colors.primary },
  title: { ...typography.title, color: "#fff" },
  subtitle: { ...typography.body, color: "#A9A3C2", marginTop: spacing.xs },
  editNumber: { ...typography.caption, color: colors.primary, fontWeight: "700", marginTop: spacing.xs },
  digitsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl },
  digitBox: {
    width: 46,
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: "#332C4D",
    backgroundColor: "#1B1630",
    color: "#fff",
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
  },
  digitBoxFilled: { borderColor: colors.primary },
  digitBoxFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.md },
  resendPill: { alignSelf: "flex-start", marginTop: spacing.lg },
  resend: { ...typography.body, color: "#68607F" },
  resendActive: { color: colors.primary, fontWeight: "700" },
});
