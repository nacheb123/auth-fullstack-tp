- **Étudiante :** Ranim Nacheb
- **Groupe :** 2BI-B
- **Enseignante :** Dr. Nesrine MEDDEB
- **Matière :** Applications Web Avancées (Next.js)

# Compte rendu : TP1, TP2, TP3

## TP1 : Authentification

**Prisma.**
- `@unique` sur `email` : la base garantit qu'il n'y a pas deux comptes avec le même email, même en cas d'inscriptions simultanées.
- `prisma/migrations` : l'historique SQL des changements de schéma. Il est versionné pour reconstruire la même base partout.
- Limite de SQLite : un fichier local, un seul écrivain à la fois, inadapté à plusieurs serveurs. En production : PostgreSQL ou MySQL.

**Session et cookie.**
- `httpOnly` : le JavaScript du navigateur ne lit pas le cookie (limite le vol par XSS). `secure` : envoi en HTTPS uniquement. `sameSite=lax` : limite le CSRF.
- Pas de mot de passe dans le JWT : un JWT est signé, pas chiffré, donc lisible par tous. On y met seulement `userId`.
- Si `JWT_SECRET` change : tous les tokens existants deviennent invalides, tous les utilisateurs sont déconnectés.

**API.**
- Même message pour email inconnu et mauvais mot de passe : empêche l'énumération des comptes.
- Le paramètre 10 de bcrypt : le coût (2^10 itérations). Plus il est élevé, plus les attaques par force brute sont lentes.
- Codes HTTP : 201 créé, 400 données invalides, 401 non authentifié, 404 introuvable, 409 conflit (email déjà utilisé).

**Middleware.**
- Pas de Prisma dans le middleware : il s'exécute dans l'Edge Runtime, sans les API Node.js nécessaires au moteur Prisma et à SQLite. On utilise `jose`, compatible Edge.
- Défense en profondeur : le middleware peut être contourné (matcher mal configuré, bug). Les pages et les API revérifient donc la session.

## TP2 : Gestion des rôles

1. **Authentification vs autorisation** : l'authentification établit *qui* est l'utilisateur ; l'autorisation détermine *ce qu'il a le droit de faire*.
2. **401 vs 403** : 401 = pas de session valide ; 403 = session valide mais rôle insuffisant.
3. **Masquer un bouton ne suffit pas** : l'interface s'exécute chez l'utilisateur, qui peut appeler l'API directement (console, curl). Seul le serveur peut faire respecter les règles.
4. **IDOR** (Insecure Direct Object Reference) : accéder à la ressource d'un autre en modifiant un identifiant dans l'URL. Ici, `GET /api/students/[id]` renvoie 403 si un étudiant demande un autre id que le sien.
5. **Ne pas accepter le rôle du client** : il est falsifiable. Le rôle est relu en base, et Zod en mode `strict` rejette les champs inattendus. À l'inscription, le rôle est toujours `ETUDIANT`.

Matrice des droits : voir le `README.md`.

## TP3 : Dashboarding

1. **KPI vs graphique.** Un KPI est un indicateur chiffré unique et synthétique, lié à un objectif (ex. nombre total d'étudiants), lisible d'un coup d'œil. Un graphique est une représentation visuelle d'un ensemble de données (répartition, évolution) qui permet de comparer et de repérer des tendances. Un graphique peut détailler un KPI.
2. **Calcul côté serveur.** Accès direct à la base, sans exposer de secrets ni de requêtes ; seules les valeurs finales sont envoyées au navigateur (moins de données, meilleures performances) ; les permissions sont appliquées avant la récupération des données ; le résultat ne peut pas être falsifié par le client.
3. **Pas de chiffres codés en dur.** Ils deviennent faux dès que les données changent, donc le dashboard ne reflète plus la réalité et induit en erreur. Ils ne sont pas maintenables.
4. **Limiter les données visibles par un enseignant.** Vérifier le rôle côté serveur (`getCurrentUser`) ; restreindre la requête Prisma (`where role = ETUDIANT`) ; limiter les champs avec `select` (pas de `password`, pas d'`email`) ; appliquer le filtre avant la récupération. Pour un périmètre par groupe, il faudrait lier l'enseignant à ses groupes dans le modèle (amélioration possible, non implémentée ici).
5. **Tests du contrôle d'accès.** Accès sans session (redirection, 401) ; un test par rôle ; appels directs aux API non autorisées (403) ; test d'IDOR (étudiant demandant un autre id) ; vérification qu'aucun `password` n'est exposé ; en bonus, tests automatisés (Vitest ou Jest).
