import * as Haptics from "expo-haptics";

/**
 * Non-essentiel à l'expérience (retour tactile "premium", façon
 * Uber/Revolut) : une erreur ici (ex: web, simulateur sans support haptique)
 * ne doit jamais interrompre le flux utilisateur, donc on avale l'erreur
 * silencieusement plutôt que de la remonter — contrairement aux erreurs
 * métier (réseau, validation) qui doivent toujours être visibles.
 */
function safeHaptic(run: () => Promise<unknown>) {
  run().catch(() => undefined);
}

export const haptics = {
  tap: () => safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  success: () => safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
