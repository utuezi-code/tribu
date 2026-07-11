export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  dialCode: string;
  flag: string;
}

export const DEFAULT_COUNTRY: Country = { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" };

export const COUNTRIES: Country[] = [
  DEFAULT_COUNTRY,
  { code: "BE", name: "Belgique", dialCode: "+32", flag: "🇧🇪" },
  { code: "CH", name: "Suisse", dialCode: "+41", flag: "🇨🇭" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "LU", name: "Luxembourg", dialCode: "+352", flag: "🇱🇺" },
  { code: "GB", name: "Royaume-Uni", dialCode: "+44", flag: "🇬🇧" },
  { code: "DE", name: "Allemagne", dialCode: "+49", flag: "🇩🇪" },
  { code: "ES", name: "Espagne", dialCode: "+34", flag: "🇪🇸" },
  { code: "IT", name: "Italie", dialCode: "+39", flag: "🇮🇹" },
  { code: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹" },
  { code: "US", name: "États-Unis", dialCode: "+1", flag: "🇺🇸" },
];

/** Formate une saisie brute en groupes lisibles ("6 12 34 56 78"), sans imposer un format E.164 rigide à l'écran. */
export function formatPhoneForDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 15);
  return digits.replace(/(\d{1,2})(?=(\d{2})+(?!\d))/g, "$1 ").trim();
}
