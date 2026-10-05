#!/bin/sh
# Applique le schéma Drizzle à la base, puis démarre l'application.
#
# Le projet n'a pas de fichiers de migration (workflow `db:push`, voir
# AGENTS.md) : le schéma vivant est `lib/db/schema.ts`, et c'est lui qui est
# poussé ici. Sur une base déjà à jour c'est un no-op rapide ; sur une base
# vide c'est ce qui crée les tables avant la première requête.
#
# `--force` valide automatiquement les changements destructifs — accepté pour
# ce projet (pas de données de production à préserver, cf. AGENTS.md).
# Désactivable avec DB_PUSH_ON_START=false (dépannage, base gérée à la main).
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

exec "$@"
