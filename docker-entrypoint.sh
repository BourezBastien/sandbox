#!/bin/sh
# Prépare puis démarre l'application :
#   1. applique le schéma de la base (drizzle-kit push)
#   2. déploie le worker Trigger.dev (l'agent qui construit les jeux)
#   3. démarre Next.js
#
# Le projet n'a pas de fichiers de migration (workflow `db:push`, voir
# AGENTS.md) : le schéma vivant est `lib/db/schema.ts`, et c'est lui qui est
# poussé ici. Sur une base déjà à jour c'est un no-op rapide ; sur une base
# vide c'est ce qui crée les tables avant la première requête.
#
# Le code du worker (`trigger/`) doit être envoyé à Trigger.dev Cloud pour que
# les jeux puissent se construire — ce conteneur est l'endroit où tout est
# réuni (code + clés). Une fois par conteneur : un simple redémarrage ne
# redéploie pas (marqueur), un nouveau déploiement Dokploy si.
#
# Les deux étapes tolèrent l'échec : elles loggent et laissent l'app démarrer.
# Coupes possibles : DB_PUSH_ON_START=false, TRIGGER_DEPLOY_ON_START=false.
set -e

if [ "$DB_PUSH_ON_START" = "false" ]; then
  echo ">> DB_PUSH_ON_START=false — schéma non appliqué, démarrage direct"
elif [ -z "$DATABASE_URL" ]; then
  echo ">> DATABASE_URL absente — schéma non appliqué, démarrage direct"
else
  echo ">> Application du schéma (drizzle-kit push)…"
  if npx drizzle-kit push --force; then
    echo ">> Schéma appliqué."
  else
    echo "!! Échec du push du schéma — démarrage quand même (voir logs ci-dessus)"
  fi
fi

if [ "$TRIGGER_DEPLOY_ON_START" = "false" ]; then
  echo ">> TRIGGER_DEPLOY_ON_START=false — worker non déployé depuis ce conteneur"
elif [ -z "$TRIGGER_ACCESS_TOKEN" ] || [ -z "$TRIGGER_PROJECT_REF" ]; then
  echo ">> TRIGGER_ACCESS_TOKEN / TRIGGER_PROJECT_REF absents — worker non déployé"
  echo ">> (sans worker, l'app tourne mais les jeux ne se construisent pas)"
  echo ">> (token : https://cloud.trigger.dev/account/tokens)"
elif [ -f /tmp/.trigger-deployed ]; then
  echo ">> Worker déjà déployé pour ce conteneur"
else
  echo ">> Déploiement du worker Trigger.dev…"
  if CI=true npx trigger deploy; then
    touch /tmp/.trigger-deployed
    echo ">> Worker déployé."
  else
    echo "!! Échec du déploiement du worker — l'app démarre quand même (voir logs)"
  fi
fi

exec "$@"
