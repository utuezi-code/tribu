/**
 * Rend visible la nature "temporaire" de l'événement — c'est le cœur de la
 * proposition de valeur de l'app (le groupe se fige et s'efface tout seul,
 * contrairement à un groupe WhatsApp qui traîne indéfiniment).
 */
export function daysUntil(dateIso: string): number {
  const target = new Date(dateIso);
  const now = new Date();
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((startOfTarget.getTime() - startOfNow.getTime()) / 86_400_000);
}

export function formatCountdown(endDateIso: string): string {
  const days = daysUntil(endDateIso);
  if (days <= 0) return "Se fige ce soir à minuit";
  if (days === 1) return "Se fige demain";
  return `Se fige dans ${days} jours`;
}
