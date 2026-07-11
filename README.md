# Tribu

Application mobile de messagerie pour groupes d'amis planifiant un événement ensemble (voyage, mariage, anniversaire, soirée). Chaque événement combine une discussion et une galerie de médias, et s'archive automatiquement à la date de fin.

## Structure du monorepo

```
apps/
  mobile/    React Native (Expo) + TypeScript strict — application mobile
  backend/   NestJS + Prisma — API, temps réel, jobs d'archivage
```

## Démarrage rapide

### Backend

```bash
cd apps/backend
cp .env.example .env   # renseigner les vraies valeurs
npm install
npx prisma migrate dev
npm run start:dev
```

### Mobile

```bash
cd apps/mobile
cp .env.example .env
npm install
npm run start
```

### Tester l'UI sur ton téléphone sans base de données

Pour voir/tester les écrans rapidement avec l'app **Expo Go**, sans installer Postgres ni configurer Supabase :

```bash
# Terminal 1 — backend simulé (aucune base de données requise)
cd apps/backend
npm install
npm run mock
```

```bash
# Terminal 2 — app mobile
cd apps/mobile
npm install
```

Dans `apps/mobile/.env` (à créer depuis `.env.example`), mets `EXPO_PUBLIC_API_URL` sur l'adresse IP locale de ta machine (pas `localhost`, ton téléphone doit pouvoir l'atteindre sur le même Wi-Fi) :

```
EXPO_PUBLIC_API_URL="http://192.168.1.XX:3000"
```

Puis :

```bash
npm run start
```

Scanne le QR code avec l'app **Expo Go** (iOS/Android). N'importe quel numéro et code à 6 chiffres fonctionnent pour se connecter — le serveur simulé (`apps/backend/mock-server.js`) accepte tout, avec quelques événements/messages de démo déjà en mémoire. Les vraies règles métier (verrouillage à l'archivage, etc.) ne sont **pas** appliquées par ce serveur : c'est un outil de test visuel, pas un environnement de test fonctionnel complet.

## Documentation

- Brief produit complet : voir le document fourni par l'équipe produit.
- Décisions d'architecture non couvertes par le brief : voir [`DECISIONS.md`](./DECISIONS.md).

## État d'avancement

Voir les commits et `DECISIONS.md` pour le détail de ce qui est implémenté, mocké, ou en attente de configuration (identifiants Supabase, Vonage, Redis, Sentry, EAS).
