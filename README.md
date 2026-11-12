   - **Étudiante :** Ranim Nacheb
   - **Groupe :** 2BI-B
   - **Enseignante :** Dr. Nesrine MEDDEB
   - **Matière :** Applications Web Avancées (Next.js)
# Auth Full Stack : TP1, TP2, TP3

Application Next.js 15 (App Router) avec authentification, gestion des rôles et tableau de bord.

## Stack

Next.js 15, React 19, TypeScript, Tailwind CSS 4, Prisma 6 (SQLite), Zod, bcryptjs, jose (JWT).

## Installation

```bash
npm install
```

Créer un fichier `.env` à la racine (jamais versionné) :

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="<chaîne aléatoire>"
```

Générer le secret :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Créer la base, puis les comptes de test :

```bash
npx prisma migrate dev
node prisma/seed.js
npm run dev
```

## Comptes de test (mot de passe : `Password123`)

| Rôle | Email |
|---|---|
| ADMIN | admin@test.com |
| ENSEIGNANT | prof@test.com |
| ETUDIANT | etudiant@test.com |

Le script `seed.js` crée aussi 7 autres étudiants, avec des groupes (GL1, GL2, INFO3) et des dates d'inscription variées (de 3 à 95 jours).

## Modèle de données

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  password  String            // hash bcrypt, jamais affiché
  role      String   @default("ETUDIANT") // ADMIN | ENSEIGNANT | ETUDIANT
  groupe    String?           // groupe / niveau pédagogique
  createdAt DateTime @default(now())
}
```

Un « étudiant » est un `User` dont le rôle est `ETUDIANT`.

## Architecture

| Fichier | Rôle |
|---|---|
| `src/lib/prisma.ts` | Client Prisma unique |
| `src/lib/validation.ts` | Schémas Zod |
| `src/lib/jwt.ts`, `session.ts` | JWT (jose) et cookie de session HttpOnly |
| `src/lib/auth.ts` | `getCurrentUser`, `requireRole` (rôle relu en base) |
| `src/lib/dashboard.ts` | Fonctions de calcul des KPI (Prisma) |
| `src/middleware.ts` | Redirection `/dashboard` et `/students` sans session |
| `src/app/api/auth/*` | register, login, logout, me |
| `src/app/api/students/*` | CRUD étudiants protégé par rôle |
| `src/app/dashboard/*` | Dashboard, avec `loading.tsx` et `error.tsx` |

## Règles par rôle

### API `/api/students`

| Action | ADMIN | ENSEIGNANT | ETUDIANT |
|---|---|---|---|
| Lister (GET) | Tous les étudiants | Tous les étudiants | Lui-même uniquement |
| Lire un étudiant (GET /:id) | Tous | Tous | Son propre id uniquement (sinon 403) |
| Créer (POST) | Oui | 403 | 403 |
| Modifier (PATCH /:id) | Tous les champs | Uniquement `groupe` d'un étudiant | 403 |
| Supprimer (DELETE /:id) | Oui (sauf son compte) | 403 | 403 |

Sans session valide : **401**. Rôle insuffisant : **403**.

### Dashboard `/dashboard`

| Élément | ADMIN | ENSEIGNANT | ETUDIANT |
|---|---|---|---|
| KPI total d'étudiants | Oui | Oui | Non |
| KPI nouveaux (30 jours) | Oui | Oui | Non |
| Répartition par groupe | Oui | Oui | Non |
| 5 derniers étudiants | Avec email | Sans email | Non |
| Informations personnelles | n/a | n/a | Oui (les siennes) |
| Gestion des étudiants | Complète | Groupe uniquement | Mon profil |

Principes de sécurité :

- Le rôle est **relu en base à chaque requête** : il n'est ni dans le JWT, ni envoyé par le client.
- Les permissions sont appliquées **avant** toute requête de données (`getDashboardData`).
- Le champ `password` n'est jamais sélectionné ni renvoyé.
- Masquer un bouton ne remplace pas le contrôle serveur : chaque route API revérifie le rôle.
- Limite connue : le modèle ne lie pas un enseignant à des groupes précis ; un enseignant voit donc tous les étudiants (données pédagogiques uniquement).

## KPI (calculés depuis la base)

- **KPI 1** : `prisma.user.count` sur le rôle `ETUDIANT`.
- **KPI 2** : `count` avec `createdAt >= maintenant - 30 jours`.
- **KPI 3** : `groupBy` sur `groupe`.
- **Tableau** : `findMany` + `orderBy createdAt desc` + `take 5`.
- Les requêtes indépendantes sont lancées en parallèle avec `Promise.all`.

## États de l'interface

- Chargement : `src/app/dashboard/loading.tsx`.
- Erreur : `src/app/dashboard/error.tsx` (bouton « Réessayer »).
- Absence de données : messages « Aucun étudiant pour le moment ».

## Tests manuels (résultats à compléter avec les captures)

| # | Test | Attendu | Résultat |
|---|---|---|---|
| 1 | `/dashboard` sans session | Redirection vers `/login` | |
| 2 | `GET /api/students` sans session | 401 | |
| 3 | Compte ADMIN | KPI, répartition, 5 derniers avec email | |
| 4 | Compte ENSEIGNANT | KPI, répartition, 5 derniers sans email | |
| 5 | Compte ETUDIANT | Informations personnelles uniquement | |
| 6 | ETUDIANT : `DELETE /api/students/1` | 403 | |
| 7 | ETUDIANT : `GET /api/students/<id d'un autre>` | 403 | |
| 8 | ENSEIGNANT : `POST /api/students` | 403 | |
| 9 | ENSEIGNANT : `PATCH` avec `name` | 400 (seul `groupe` autorisé) | |
| 10 | Recherche de `password` dans les réponses | Absent | |
| 11 | Les KPI correspondent à Prisma Studio | Oui | |

Commandes de test (console du navigateur, une fois connecté) :

```js
fetch("/api/students").then(r => console.log(r.status))
fetch("/api/students/1", { method: "DELETE" }).then(r => console.log(r.status))
fetch("/api/students").then(r => r.text()).then(t => console.log(t.includes("password")))
```
