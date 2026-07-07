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

## Documentation

- Brief produit complet : voir le document fourni par l'équipe produit.
- Décisions d'architecture non couvertes par le brief : voir [`DECISIONS.md`](./DECISIONS.md).

## État d'avancement

Voir les commits et `DECISIONS.md` pour le détail de ce qui est implémenté, mocké, ou en attente de configuration (identifiants Supabase, Vonage, Redis, Sentry, EAS).
