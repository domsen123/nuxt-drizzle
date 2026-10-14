# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nuxt 4 SaaS starter template using vertical slice architecture. Full-stack TypeScript application with PostgreSQL backend.

## Commands

```bash
# Development
pnpm dev                    # Start dev server (localhost:3000)
pnpm lint                   # Run ESLint
pnpm typecheck              # TypeScript checking

# Build
pnpm build                  # Production build
pnpm preview                # Preview production build

# Database (PostgreSQL via Docker)
pnpm docker:up              # Start PostgreSQL container
pnpm docker:clean           # Clean/rebuild containers
pnpm db:push                # Push schema to database
pnpm db:generate            # Generate migrations
pnpm db:migrate             # Apply migrations
pnpm db:studio              # Open Drizzle Studio UI
```

## Architecture

This project follows **vertical slice architecture** - features are organized as self-contained slices rather than horizontal layers.

### Directory Structure

- **app/** - Nuxt client-side application
  - `features/` - Feature slices (components, composables, types, API wrappers)
  - `components/` - Shared global components (App-prefixed)
  - `layouts/` - Page layouts (default, auth)
  - `pages/` - File-based routing
  - `utils/routes.ts` - Route constants

- **server/** - Nitro backend
  - `features/` - Feature services
  - `database/schema/` - Drizzle ORM schemas
  - `database/migrations/` - Generated migrations
  - `infrastructure/database/client.ts` - Drizzle client setup
  - `middleware/01.auth.ts` - Session injection (Nitro sorts middleware by filename)
  - `middleware/02.anon-auth.ts` - Anonymous session for page requests
  - `utils/container.ts` - Dependency injection composition root
  - `api/` - API routes (thin, delegate to services)

- **shared/** - Cross-cutting types and utilities

### Key Patterns

**Services**: Use generic ItemService pattern for type-safe CRUD with filter operators (_eq, _gt, _in, _like, etc.), sorting, pagination, and relation support.

**Dependency Injection**: Factory functions in `server/utils/container.ts` - services receive dependencies explicitly.

**State Management**: Pinia Colada for server state caching, integrated via composables.

**Authentication**: Self-implemented session-based auth with httpOnly cookies and database-backed sessions.

## Tech Stack

- **Framework**: Nuxt 4.6.1 (Vue 3)
- **UI**: Nuxt UI with Tailwind CSS
- **Database**: PostgreSQL + Drizzle ORM
- **State**: Pinia + Pinia Colada
- **i18n**: @nuxtjs/i18n (en/de, strategy `no_prefix`)
- **Content**: @nuxt/content (legal pages)
- **Validation**: Zod
- **Package Manager**: pnpm 10.23.0
- **Node**: 22.22.3+, 24.15+ or 26+

## Database Workflow

1. Define schema in `server/database/schema/*.ts`
2. Run `pnpm db:generate` to create migration
3. Run `pnpm db:migrate` to apply migrations

## Environment Variables

Key variables (see `.env.example`):
- `NUXT_DATABASE_*` - PostgreSQL connection
- `NUXT_AUTH_SECRET` - Session secret
- `NUXT_SITE_NAME`, `NUXT_PUBLIC_SITE_URL` - Site config

## Pinia-Colada Queries
Use `useQuery` from Pinia-Colada for data fetching with caching. Example:

```typescript
const { data, isLoading } = useQuery(queryOptions, () => ({ param: value.value }))
```

## Internationalization (i18n)

The app ships in English (`en`, default) and German (`de`). Rules for every change:

- Put every user-facing string of non-admin surfaces behind `$t`/`t()` keys. Add the
  keys to both `i18n/locales/en.json` and `i18n/locales/de.json` — identical key sets,
  `en.json` is the reference. Namespaces per feature (`common`, `nav`, `auth`, `settings`,
  `profile`, `legal`, `errors`).
- Admin stays English: no `$t` in `app/pages/admin/**` or admin feature components.
  The shared user menu is the only translated piece inside /admin.
- Non-admin API errors: add `data: { code: '<feature>.<error>' }` to user-facing
  `createError` calls, keep `statusText` English, and add the `errors.*` keys to both
  locale files. Components map errors only through `useApiErrorMessage()`.
- Interpolation with `{placeholder}` or `<i18n-t>`; never concatenate translated strings.
  Escape `@` in messages as `{'@'}`.
- Dates and numbers outside /admin go through `useLocaleFormat()`.
- Language preference: guests via i18n cookie, users via `users.preferences.locale`
  (persisted through `useLanguage()` → `PUT /api/profile/preferences`).
- New emails need a German variant: `server/assets/templates/<name>.de.{html,txt}.liquid`;
  the loader falls back to the English base file.

## Reference

See `_ARCHITECTURE.md` for comprehensive vertical slice architecture documentation, including feature checklists, anti-patterns, and the i18n conventions (section 11).

## Server Code

Import `defineEventHandler` and every request helper explicitly from
`nuxt/server`, never from the h3 auto-imports:

```typescript
import { createError, defineEventHandler, getRouterParam, readBody } from 'nuxt/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id', { decode: true })
  if (!id)
    throw createError({ status: 400, statusText: 'Missing id' })

  return container.items.users.readOne(id)
})
```

- A handler receives a `RequestEvent`: read the request through `event.req`,
  write response headers through `event.res.headers`.
- `getRouterParam` returns percent-encoded values, so pass `{ decode: true }`.
- `createError` takes `status` and `statusText`; `statusCode`/`statusMessage`
  are deprecated aliases.
- Mixing a `nuxt/server` helper with an auto-imported h3 one in the same file
  fails the request with `NUXT_E8012`.
- Nitro's own helpers (`defineTask`, `defineNitroPlugin`, `useStorage`) have no
  `nuxt/server` equivalent and stay auto-imported, in files that use no
  `nuxt/server` helper.

## Styles
- use arrow functions if possible
- use `pnpm lint --fix` and `pnpm typecheck` after code changes to ensure code quality
- common alias:
  - **./app**: ~/
  - **./server**: ~~server/
  - **./shared**: ~~shared/
- zod: keep in mind that we are on zod v4. (use context7)
  - use trim() for strings to avoid leading/trailing spaces
  - 
