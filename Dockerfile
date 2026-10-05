# Sandbox — application Next.js.
# Dokploy : Application → Build Type = Dockerfile, path = Dockerfile,
# context = racine du repo, port = 3000, variables dans Application → Environment.
#
# L'image finale garde node_modules complet (drizzle-kit inclus) : le
# conteneur applique le schéma de la base au démarrage (docker-entrypoint.sh),
# puis sert l'app avec `npm start`.
# syntax=docker/dockerfile:1
FROM node:24-alpine AS build
WORKDIR /app

# Le build Next.js évalue certains modules (Better Auth, le client Daytona)
# qui rejettent une valeur absente. Des placeholders suffisent à la
# construction — les vraies valeurs viennent de l'environnement d'exécution.
ARG BETTER_AUTH_SECRET=build-time-placeholder-0123456789abcdef
ARG DAYTONA_API_KEY=build-time-placeholder
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET} \
    DAYTONA_API_KEY=${DAYTONA_API_KEY}

COPY package.json package-lock.json ./
RUN --mount=type=cache,id=sb-npm-cache,target=/root/.npm \
    npm ci

COPY . .
RUN npm run build

FROM node:24-alpine
RUN apk add --no-cache curl
WORKDIR /app

# `npm start` a besoin de la sortie du build et des fichiers que Next lit au
# démarrage ; l'entrypoint a besoin de drizzle.config.ts + lib/db pour le push
# du schéma, et de trigger/ + lib/ + tsconfig.json pour déployer le worker
# Trigger.dev depuis le conteneur.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/instrumentation.ts ./instrumentation.ts
COPY --from=build /app/instrumentation-client.ts ./instrumentation-client.ts
COPY --from=build /app/sentry.server.config.ts ./sentry.server.config.ts
COPY --from=build /app/sentry.edge.config.ts ./sentry.edge.config.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/lib ./lib
COPY --from=build /app/trigger ./trigger
COPY --from=build /app/trigger.config.ts ./trigger.config.ts
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "start"]
