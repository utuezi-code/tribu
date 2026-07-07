import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * `null` tant que le projet Supabase n'est pas configuré : les écrans qui
 * s'abonnent au temps réel doivent gérer ce cas (repli sur rafraîchissement
 * manuel) plutôt que planter.
 */
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
