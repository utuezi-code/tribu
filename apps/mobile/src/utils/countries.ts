import * as Localization from "expo-localization";

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
  { code: "MA", name: "Maroc", dialCode: "+212", flag: "🇲🇦" },
  { code: "DZ", name: "Algérie", dialCode: "+213", flag: "🇩🇿" },
  { code: "TN", name: "Tunisie", dialCode: "+216", flag: "🇹🇳" },
  { code: "SN", name: "Sénégal", dialCode: "+221", flag: "🇸🇳" },
  { code: "US", name: "États-Unis", dialCode: "+1", flag: "🇺🇸" },
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** Filtre insensible aux accents/casse, par nom de pays ou indicatif ("bel", "+33", "33"). */
export function searchCountries(query: string): Country[] {
  const q = normalize(query);
  if (!q) return COUNTRIES;
  return COUNTRIES.filter(
    (c) => normalize(c.name).includes(q) || c.dialCode.replace("+", "").includes(q.replace("+", "")),
  );
}

/**
 * Présélectionne le pays de l'utilisateur d'après la locale de l'appareil
 * (comme WhatsApp/Telegram), avec repli sur la France si la région
 * détectée n'est pas dans la liste courte ci-dessus.
 */
export function detectDefaultCountry(): Country {
  const region = Localization.getLocales()[0]?.regionCode;
  return COUNTRIES.find((c) => c.code === region) ?? DEFAULT_COUNTRY;
}

/** Formate une saisie brute en groupes lisibles ("6 12 34 56 78"), sans imposer un format E.164 rigide à l'écran. */
export function formatPhoneForDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 15);
  return digits.replace(/(\d{1,2})(?=(\d{2})+(?!\d))/g, "$1 ").trim();
}
