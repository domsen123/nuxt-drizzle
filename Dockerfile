# syntax=docker/dockerfile:1

# ---- Base ----------------------------------------------------------------
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ---- Build ---------------------------------------------------------------
FROM base AS build
# Native deps (bcrypt, sharp) ggf. kompilieren
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ---- Production ----------------------------------------------------------
FROM base AS production
ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# Nur das fertige Nitro-Output-Bundle (inkl. node_modules) übernehmen
COPY --from=build /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
