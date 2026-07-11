# Journal de décisions d'architecture

Ce fichier documente les choix faits pour des points non couverts explicitement par le brief produit, conformément à la consigne de comportement de l'agent (section 8 du brief).

## 2026-07-07 — Structure du monorepo

- **Choix** : un seul repo Git avec `apps/mobile` (Expo) et `apps/backend` (NestJS), gérés via npm workspaces (pas de Turborepo/Nx pour rester simple en V1).
- **Raison** : le brief autorise explicitement "app mobile + backend séparés ou monorepo". Un monorepo simplifie la CI et le partage de types plus tard.
- **Alternative envisagée** : package `packages/shared` pour les types communs (enums Prisma, DTOs). Pas créé pour l'instant pour limiter la complexité initiale ; à extraire si la duplication devient un problème.

## 2026-07-07 — Navigation mobile

- **Choix** : React Navigation (native-stack + bottom-tabs), pas Expo Router.
- **Raison** : le brief ne mandate pas de solution de routing précise. React Navigation est le standard historique de l'écosystème RN/Expo et correspond mieux à une structure d'écrans imbriqués (stack Auth → Tabs Accueil → Détail Événement → Onglets internes Discussion/Galerie) telle que montrée dans les maquettes.

## 2026-07-07 — Écart entre le brief et les maquettes : navigation "Messages / Événements"

- **Constat** : la section 6 (Ordre de construction, étape 3) mentionne "écrans Accueil (Messages / Événements), structure de tabs", mais les maquettes fournies ne montrent qu'un seul écran d'accueil ("Tes événements") sans barre d'onglets Messages/Événements séparée.
- **Décision** : les maquettes faisant foi sur le visuel ("le design est déjà finalisé... implémente-le, ne réinvente pas"), l'accueil est implémenté comme un écran unique avec sections "événements actifs" / "archivés", sans tab bar Messages séparée.
- **Signalement** : ce point est explicitement remonté à l'utilisateur — à confirmer si une vraie tab "Messages" (liste de conversations indépendante des événements) est prévue pour une itération future.

## 2026-07-07 — Identifiants et services externes non disponibles dans l'environnement de build

- **Constat** : aucun projet Supabase, compte Vonage, instance Redis, ou DSN Sentry n'est configuré dans cet environnement de développement.
- **Choix** : toutes les intégrations externes sont écrites derrière des interfaces/abstractions avec une implémentation "mock"/dev par défaut, activée par variables d'environnement (`.env.example` fourni dans chaque app). Le code de production (Vonage, Supabase, BullMQ+Redis, Sentry) est écrit et prêt, mais nécessite les vraies clés pour être testé en conditions réelles.
- **Action requise côté utilisateur** : fournir les clés Supabase (URL, service role key, anon key), un compte/API key Vonage, une URL Redis, et un DSN Sentry pour activer les intégrations réelles.

## 2026-07-07 — Jobs d'archivage

- **Choix** : BullMQ + Redis (premier choix listé dans le brief), avec un mécanisme de rattrapage au démarrage (`ArchiveCatchupService`) qui recherche les événements dont la date de fin/fenêtre de grâce est dépassée mais dont le statut n'a pas encore été mis à jour.
- **Raison** : BullMQ permet une planification par événement (delayed jobs) reprogrammable facilement lors d'un report de date, contrairement à pg_cron qui nécessiterait une re-planification SQL plus complexe pour un job par événement.
- **Idempotence** : chaque transition de statut est protégée par une vérification de l'état courant en base avant écriture (garde contre la double exécution), et journalisée dans `ArchiveJobLog`.

## 2026-07-07 — Compression média

- **Choix** : compression côté client (mobile), avant upload, via `expo-image-manipulator` pour les photos ; la compression vidéo réelle (transcodage) est hors scope V1 et documentée comme limitation — seule une limite de taille/résolution est appliquée côté client pour les vidéos.
- **Raison** : le brief impose "Compression à l'upload obligatoire" sans préciser client ou serveur. Compresser côté client réduit la bande passante consommée dès l'upload (pertinent pour le cas "connexion faible" du DoD).

## 2026-07-07 — Temps réel

- **Choix** : Supabase Realtime en écoute directe des changements Postgres sur les tables `Message` et `Media` depuis le client mobile (canal par `eventId`), le backend NestJS restant responsable de la validation métier à l'écriture (event archivé → refus, etc.) via l'API REST.
- **Raison** : évite de dupliquer un serveur WebSocket (Socket.io) tant que Supabase Realtime suffit ; le brief prévoit Socket.io uniquement "si limitation rencontrée".

## 2026-07-07 — Stockage des codes OTP

- **Constat** : le modèle de données du brief ne prévoit pas de table pour stocker les codes de vérification SMS.
- **Choix** : ajout d'un modèle `OtpCode` (non présent dans le brief) — code haché (jamais stocké en clair), expiration à 5 minutes, compteur de tentatives (max 5) pour limiter le brute-force, `consumedAt` pour empêcher la réutilisation.
- **Raison** : nécessaire pour implémenter la vérification SMS décrite dans les maquettes (écran "Entre le code" avec minuteur de renvoi) ; c'est une extension additive du schéma, pas une modification des modèles fournis.

## 2026-07-07 — Invitation par lien

- **Constat** : le brief mentionne "invitation d'amis (par lien ou contacts)" mais le modèle de données ne prévoit pas de champ pour un lien d'invitation.
- **Choix** : ajout d'un champ `inviteCode` (unique, généré automatiquement) sur `Event`, utilisé pour construire un lien du type `https://tribu.app/join/{inviteCode}`. Rejoindre par contacts (liste de numéros de téléphone) est géré séparément via `POST /events/:id/members`.
- **Limite connue** : l'import du carnet de contacts natif (`expo-contacts`) nécessite une permission utilisateur ; l'écran de création d'événement propose la saisie manuelle de numéros en V1, l'intégration du carnet d'adresses est un point à valider avec les maquettes détaillées de cet écran si un accès contacts natif est attendu.

## 2026-07-07 — Dépendance ajoutée : `luxon`

- **Constat** : la règle d'archivage ("exécuté à minuit dans le fuseau horaire de l'organisateur") nécessite un calcul fiable de minuit local par fuseau horaire (DST inclus), ce que `Date` natif ne permet pas de faire correctement.
- **Choix** : ajout de `luxon` (petite lib de gestion de dates/fuseaux, ~pas de dépendances) au backend. Non listée dans la stack imposée — signalée ici comme demandé par la consigne de comportement (section 4 du brief).
- **Alternative rejetée** : `date-fns-tz`, plus verbeux pour ce cas d'usage précis (arithmétique de fuseaux horaires).

## 2026-07-07 — Mécanisme d'archivage : sweep DB périodique comme source de vérité, BullMQ en optimisation

- **Constat** : cet environnement de développement n'a pas de serveur Redis disponible pour tester BullMQ, et le DoD exige de tester explicitement "panne serveur au moment du job" et "double exécution".
- **Choix** :
  1. Une tâche périodique (`@nestjs/schedule`, toutes les 5 minutes + une passe au démarrage du module = rattrapage) interroge la base pour trouver les événements dont la transition d'état est due (`ACTIVE` → `GRACE_PERIOD` à minuit local du lendemain de `endDate` ; `GRACE_PERIOD` → `ARCHIVED` 48h plus tard) et applique la transition de façon idempotente (vérifie l'état actuel avant d'écrire, journalise dans `ArchiveJobLog`). C'est cette tâche qui fait foi et qui garantit la survie à un redémarrage serveur : elle rattrape tout événement en retard, peu importe combien de temps le serveur était arrêté.
  2. Si `REDIS_URL` est configuré, un job BullMQ delayed est en plus programmé par événement (précision à la seconde près, plutôt qu'attendre le prochain sweep de 5 min). Sans Redis, le module fonctionne quand même correctement (juste avec une précision de quelques minutes au lieu d'une précision exacte) — dégradation explicite et journalisée au démarrage.
- **Raison** : rend la mécanique testable unitairement sans dépendre d'une infra externe (Redis) absente de cet environnement, tout en respectant l'exigence de robustesse au redémarrage. BullMQ reste utilisé comme demandé, mais en optimisation plutôt qu'en unique source de vérité.
- **Tests couvrant les cas limites du DoD** : voir `src/archive/archive-sweep.service.spec.ts` — archivage normal, rattrapage après "panne" (sweep lancé en retard), double exécution du sweep (idempotence).

## 2026-07-07 — Dépendances mobiles ajoutées : `zustand`, `@react-native-community/netinfo`

- **Constat** : le brief n'impose pas de librairie de state management ni de détection réseau, mais §7 du DoD exige un fonctionnement correct testé en mode avion / réseau throttlé, et l'étape 5 exige une "gestion hors-ligne avec file d'attente locale".
- **Choix** : `zustand` pour la session utilisateur (léger, pas de boilerplate) ; `@react-native-community/netinfo` pour détecter la reconnexion et déclencher le vidage de la file d'attente de messages hors-ligne (`src/offline/messageQueue.ts`).

## 2026-07-07 — Absence d'écran "nom d'affichage" à l'inscription

- **Constat** : `User.displayName` est un champ obligatoire dans le modèle de données, mais aucun écran de saisie du nom n'est listé dans la section 2 du brief ni visible dans les maquettes fournies (le parcours va directement de la vérification du code SMS à l'accueil).
- **Choix temporaire** : `displayName` est initialisé au numéro de téléphone à la création du compte (`AuthService.verifyOtp`), modifiable plus tard depuis un écran de profil (non spécifié non plus).
- **Signalement** : à confirmer — un écran "comment veux-tu qu'on t'appelle ?" est-il prévu entre la vérification OTP et l'accueil dans les maquettes détaillées, ou le nom doit-il être repris automatiquement des contacts du téléphone ?

## 2026-07-07 — Upload média nécessite un vrai projet Supabase pour être testé de bout en bout

- **Constat** : `pickAndUploadMedia` (mobile) fait un vrai `fetch PUT` vers l'URL signée retournée par le backend. Sans `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` configurés, le backend renvoie une URL de dev factice (`https://dev-storage.local/...`), et cet appel PUT échouera réellement (domaine inexistant).
- **Choix** : ne pas masquer cet échec silencieusement (conforme au DoD "jamais d'échec silencieux") — l'écran affichera une erreur explicite tant qu'un vrai projet Supabase Storage n'est pas branché.
- **Action requise côté utilisateur** : fournir les identifiants Supabase pour tester le parcours complet d'upload de médias.

## 2026-07-07 — Un seul écran pour événement actif et archivé

- **Choix** : `EventDetailScreen` gère les deux cas (actif/grâce/archivé) plutôt que deux écrans séparés, en s'appuyant sur `event.status` pour afficher le bandeau "Terminé", verrouiller le composeur, et masquer le bouton d'ajout de médias une fois `ARCHIVED`.
- **Raison** : le brief lui-même décrit l'écran archivé comme "même structure que l'événement actif" (section 2, point 7) — dupliquer l'écran aurait introduit une divergence à maintenir sans bénéfice.

## 2026-07-07 — Support Expo Web ajouté (prévisualisation uniquement)

- **Constat** : `"main": "node_modules/expo/AppEntry.js"` casse la résolution de bundle dans un monorepo npm workspaces (les dépendances sont hissées à la racine, pas dans `apps/mobile/node_modules`), ce qui empêchait même `expo start --web` de démarrer.
- **Choix** : `main` pointe maintenant vers un `index.js` local (`registerRootComponent(App)`), et `react-dom`/`react-native-web`/`@expo/metro-runtime` sont ajoutés pour permettre `npm run web`. Utilisé ici pour valider visuellement les écrans (captures d'écran) sans simulateur iOS/Android disponible dans cet environnement.
- **Portée** : la cible produit reste iOS/Android natif (`expo start --ios`/`--android`) ; le mode web est un outil de vérification/démo, pas une plateforme livrée.

## 2026-07-11 — Refonte de l'écran de connexion (demande explicite utilisateur)

- **Constat** : l'utilisateur a jugé l'écran de connexion initial (fidèle aux maquettes fournies) insuffisamment abouti et a explicitement demandé une mise à jour vers des tendances UX/UI plus actuelles. Ceci prime sur la consigne générale "n'improvise pas de style" du brief, puisque c'est une instruction directe et postérieure de l'utilisateur sur cet écran précis.
- **Changements** :
  - `PhoneScreen` : héro en dégradé (`expo-linear-gradient`, nouvelle dépendance) surmonté d'une carte blanche flottante avec ombre portée, au lieu d'un fond plat.
  - Sélecteur d'indicatif pays remplacé par une puce pressable ouvrant un bottom-sheet (`CountryPickerModal`) avec une liste de pays, plutôt qu'un champ texte libre propice aux erreurs de saisie.
  - Numéro de téléphone auto-formaté en groupes ("6 12 34 56 78") via `formatPhoneForDisplay`.
  - Bouton principal en pilule avec ombre colorée et micro-animation d'appui (scale), réutilisé partout via `PrimaryButton`.
  - `OtpScreen` : indicateur d'étapes (2 points), lien "Modifier le numéro" pour revenir en arrière, cases de code avec halo lumineux sur la case active, et animation de secousse (shake) en cas de code invalide.
- **Portée non traitée** : pas de mode sombre système ni de nouvelle refonte des autres écrans (Accueil, Création d'événement, etc.) — cette itération se limite à l'écran de connexion signalé par l'utilisateur. À élargir sur demande.

## 2026-07-11 — Composant `FormInput` partagé + correction du rendu des champs

- **Constat** : l'utilisateur a signalé que le champ de saisie était "bizarre". Cause identifiée : sur RN Web, un `TextInput` focalisé reçoit l'anneau de focus par défaut du navigateur (rectangulaire, non arrondi), en plus/à la place du style de focus de l'app ; de plus la puce d'indicatif pays et le champ téléphone n'avaient pas la même hauteur (aucun des deux n'avait de `height`/`paddingVertical` explicite), ce qui les désalignait visuellement.
- **Choix** : extraction d'un composant `FormInput` (`src/components/FormInput.tsx`) réutilisé par `PhoneScreen` et `CreateEventScreen`, avec hauteur fixe (52px, alignée sur la puce pays et les puces de date), état de focus géré par l'app (bordure + halo violet cohérents avec le reste du design) et `outlineStyle: "none"` pour désactiver l'anneau natif du navigateur sur web (extension web-only de react-native-web, absente des types RN standards — cast isolé documenté dans le fichier).
- **Padding/marges** : augmentés sur `PhoneScreen` (carte, espacement entre sections) et `CreateEventScreen` (padding du conteneur, espacement entre les blocs de formulaire) suite à la demande explicite de l'utilisateur d'aérer ces écrans.

## 2026-07-11 — Patterns UX inspirés d'apps de référence (WhatsApp, Telegram, Revolut/Uber)

- **Constat** : demande explicite de s'inspirer des UX existantes pour l'écran de connexion.
- **Changements** :
  - **Présélection du pays par locale de l'appareil** (`expo-localization`, nouvelle dépendance) au lieu d'un indicatif fixe — comportement WhatsApp/Telegram.
  - **Recherche dans le sélecteur de pays** (par nom ou indicatif, insensible aux accents/casse) — nécessaire dès que la liste dépasse une poignée d'entrées, pattern universel des sélecteurs de pays.
  - **Autofill SMS natif** : `textContentType="oneTimeCode"` (iOS) / `autoComplete="sms-otp"` (Android) sur les cases de code, avec correction de la logique de saisie pour distribuer correctement un code collé/auto-rempli d'un coup sur plusieurs cases (auparavant, seul le dernier caractère était conservé — bug qui aurait cassé l'autofill natif).
  - **Retour haptique** (`expo-haptics`, nouvelle dépendance) : léger sur les appuis de bouton et de saisie de code, succès/erreur sur la vérification — pattern tactile "premium" courant sur Uber/Revolut/N26. Désactivé silencieusement si indisponible (web, certains émulateurs) car non essentiel au fonctionnement.
- **Portée** : concentré sur le flux de connexion (Phone + OTP), qui est l'écran signalé par l'utilisateur. Le retour haptique sur `PrimaryButton` bénéficie cependant à tous les écrans qui l'utilisent déjà.

## 2026-07-11 — Écran code SMS : fond blanc (demande explicite utilisateur)

- **Constat** : l'écran de vérification du code SMS était en thème sombre (fidèle aux maquettes fournies). L'utilisateur a explicitement demandé un arrière-plan blanc, cohérent avec le reste de l'app — ceci prime sur la maquette d'origine.
- **Changement** : `OtpScreen` passe en thème clair (`colors.surface`/`colors.background`/`colors.text` au lieu des couleurs sombres codées en dur).
- **Effet de bord corrigé au passage** : l'anneau de focus noir par défaut du navigateur (RN Web), déjà corrigé sur `FormInput`, était encore présent sur les cases de code (qui utilisent un `TextInput` brut, pas `FormInput`) et devenait très visible sur fond blanc. Extrait `webNoOutline` dans `src/utils/webStyles.ts` (partagé par `FormInput` et `OtpScreen`) pour éviter la duplication future.

## 2026-07-11 — Serveur simulé sans base de données (`apps/backend/mock-server.js`)

- **Constat** : l'utilisateur veut tester l'app sur son propre téléphone (Expo Go) sans configurer Postgres/Supabase.
- **Choix** : formalisation en outil de dev committé (`npm run mock` dans `apps/backend`) du serveur HTTP minimal (Node natif, aucune dépendance) déjà utilisé pour générer les captures d'écran pendant cette session. Implémente les mêmes routes que l'API réelle avec des données en mémoire (réinitialisées à chaque redémarrage), OTP accepté sans vérification, et un endpoint d'upload factice qui accepte n'importe quel fichier sans le stocker.
- **Limites explicites (documentées dans le README)** : ce n'est pas un environnement de test fonctionnel — les règles métier (verrouillage à l'archivage, validation OTP réelle, JWT signé, persistance) ne sont pas appliquées. Usage strictement réservé à la vérification visuelle de l'UI.

---

*Ce fichier sera complété au fil du développement.*
