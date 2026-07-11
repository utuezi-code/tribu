/**
 * Lien profond `tribu://` — s'ouvre directement dans l'app si elle est déjà
 * installée. Ne mène nulle part pour un destinataire qui n'a pas encore
 * l'app (aucune page web d'atterrissage n'est déployée dans ce projet) ;
 * voir DECISIONS.md. Le code brut est donc toujours partagé en secours,
 * saisissable manuellement via "J'ai un code d'invitation" sur l'accueil.
 */
export function buildInviteLink(inviteCode: string): string {
  return `tribu://join/${inviteCode}`;
}
