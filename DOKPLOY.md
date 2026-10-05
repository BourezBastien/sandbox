# Sandbox — Déploiement Dokploy (guide complet)

## Architecture

| Service | Type Dokploy | Source | Port |
|---------|-------------|--------|------|
| PostgreSQL | Database | Image intégrée Dokploy | 5432 (à exposer publiquement) |
| Sandbox (app) | Application | GitHub → Dockerfile | 3000 |
| Worker Trigger.dev | Cloud Trigger.dev | GitHub Action (auto sur push) | — |

> L'agent qui construit les jeux tourne chez Trigger.dev (cloud), pas sur votre
> serveur. Il a besoin de joindre PostgreSQL : c'est la seule raison pour
> laquelle la base doit être **exposée publiquement** (SSL + mot de passe long).
> Le déploiement du worker est automatique via GitHub Actions — rien à lancer
> en local.

---

## Étape 0 — Préparer les comptes (une fois)

1. **Trigger.dev** : créez un projet sur [cloud.trigger.dev](https://cloud.trigger.dev)
   (plan Hobby $10/mois recommandé : 50 tours simultanés pour la classe).
   Dans *Project Settings → Environment Variables*, ajoutez pour
   l'environnement **production** :

   ```env
   DATABASE_URL=postgres://...:...@ADRESSE_PUBLIQUE:5432/sandbox  (voir étape 2)
   Z_AI_API_KEY=...
   DAYTONA_API_KEY=...
   ```

2. **z.ai** : créez une clé sur [api.z.ai](https://api.z.ai). Votre clé
   d'abonnement GLM Coding Plan fonctionne pour tester seule ; prenez une clé
   à l'usage pour la classe (quelques $/mois).

3. **Daytona** : créez un compte sur [app.daytona.io](https://app.daytona.io)
   ($200 de crédits offerts) et copiez la clé API.

4. **Secrets GitHub** : dans le repo → *Settings → Secrets and variables →
   Actions*, ajoutez :

   ```env
   TRIGGER_SECRET_KEY=...      (Project Settings → Secret Key, chez Trigger.dev)
   TRIGGER_PROJECT_REF=...     (la réf du projet, ex. proj_xxxxxxxxxxxx)
   ```

---

## Étape 1 — Créer le projet Dokploy

1. Ouvrez Dokply : `http://IP-SERVEUR:3000`
2. **New Project** → nom : `sandbox`

## Étape 2 — PostgreSQL

1. Dans le projet : **New → Database → PostgreSQL**, nom : `sandbox-db`
2. Après création, onglet **Connection Info** : copiez la `DATABASE_URL`
   interne (elle servira à l'application) :

   ```env
   postgresql://user:pass@sandbox-db:5432/sandbox
   ```

3. **Exposer la base publiquement** (pour le worker Trigger.dev) :
   onglet **Network / Ports**, exposez le port 5432, puis notez l'URL publique
   (`postgres://user:pass@VOTRE-DOMINE-DB:5432/sandbox`).
   Utilisez un **mot de passe long** et gardez le SSL activé.

## Étape 3 — Connecter GitHub

1. **Settings → GitHub → Install GitHub App**
2. Autorisez le repo `BourezBastien/sandbox`

## Étape 4 — Déployer l'application

1. **New → Application**, nom : `sandbox-app`
2. **Source** : GitHub, repo `BourezBastien/sandbox`, branche `main`
3. **Build Type** : `Dockerfile` — chemin : `Dockerfile`, contexte : `/`
4. **Port** : `3000`

### Variables d'environnement (onglet Environment)

```env
NODE_ENV=production

# Étape 2 — URL interne
DATABASE_URL=postgresql://...@sandbox-db:5432/sandbox

# Auth — secret de 32+ caractères : openssl rand -base64 32
BETTER_AUTH_SECRET=
# URL publique de l'app (celle du domaine créé à l'étape 5)
BETTER_AUTH_URL=https://sandbox.votre-domaine.fr

# IA
Z_AI_API_KEY=

# Daytona
DAYTONA_API_KEY=

# Optionnel — Sentry
# SENTRY_DSN=
# SENTRY_ORG=
# SENTRY_PROJECT=
# SENTRY_AUTH_TOKEN=
# SENTRY_ENVIRONMENT=production
```

> Le schéma de la base est **appliqué automatiquement au démarrage** du
> conteneur (`drizzle-kit push`, voir `docker-entrypoint.sh`). Sur une base
> vide, les tables sont créées avant la première requête. Pour désactiver :
> `DB_PUSH_ON_START=false`.

5. Cliquez **Deploy** (3-5 minutes de build)
6. Vérifiez dans **Logs** : `>> Schéma appliqué.` puis le démarrage Next.js

## Étape 5 — Domaine

1. Onglet **Domains → New Domain** : `sandbox.votre-domaine.fr`, port `3000`
2. SSL automatique (Let's Encrypt)
3. Mettez à jour `BETTER_AUTH_URL` avec cette adresse et redeployez

## Étape 6 — Déployer le worker Trigger.dev

C'est **automatique** : chaque push sur `main` qui touche `trigger/`, `lib/`
ou les dépendances déclenche l'action *Deploy Trigger.dev worker*
(`.github/workflows/deploy-trigger.yml`), à condition que les secrets de
l'étape 0 soient en place.

Vérifiez le premier run dans l'onglet **Actions** du repo, puis ouvrez
cloud.trigger.dev : le task `game-chat` doit apparaître comme déployé.

## Étape 7 — Mise en service

1. Ouvrez `https://sandbox.votre-domaine.fr/install`
2. Créez le compte admin (une seule fois, la page se verrouille après)
3. `/admin/users` → créez les comptes élèves (identifiant + mot de passe)
4. Les élèves se connectent sur `/sign-in`

---

## Vérification finale

```bash
# L'app répond ( redirection vers /sign-in)
curl -I https://sandbox.votre-domaine.fr

# Le worker est en ligne : envoyez "hello" dans un jeu et regardez
# le run apparaître sur cloud.trigger.dev
```

## Dépannage

| Problème | Solution |
|----------|----------|
| Logs : `Échec du push du schéma` | Vérifiez `DATABASE_URL` (doit pointer vers `sandbox-db`) |
| `/install` redirige vers `/sign-in` | Un admin existe déjà — la base n'est pas vide |
| Erreur 500 au premier tour de jeu | Vérifiez `Z_AI_API_KEY` (app) **et** chez Trigger.dev |
| `Game has no sandbox yet` persistant | Vérifiez `DAYTONA_API_KEY` chez Trigger.dev |
| Le run Trigger échoue : connexion DB | Le worker utilise l'URL **publique** de la base (étape 2.3) |
| Les jeux ne se construisent pas | Onglet Actions du repo : le workflow a-t-il tourné avec les secrets ? |
| Cookie de session rejeté | `BETTER_AUTH_URL` doit être exactement l'URL publique finale |
