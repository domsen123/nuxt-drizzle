# Nuxt Vertical Slice Architecture Cookbook

> Target: Senior Nuxt Developer  
> Stack: Nuxt 3, Drizzle ORM, PostgreSQL, Pinia Colada

---

## 1. Architecture Overview

### Philosophy

Traditional Nuxt organizes by **technical layer** (components/, composables/, stores/). This approach organizes by **feature**. Everything a feature needs lives together. Changes are localized. Features can be understood in isolation.

### Core Principles

- **Feature independence**: Each slice self-contained
- **Explicit dependencies**: Import from other features through public index.ts
- **Shared layer**: Cross-cutting concerns (auth, UI primitives, utils) live in shared/
- **Thin pages**: Pages orchestrate features, contain minimal logic
- **Thin API routes**: HTTP handlers delegate to services immediately

---

## 2. Folder Structure

```
app/features/                         # Client-side feature slices
  products/
    api/
      product.api.ts              # $fetch wrappers
      product.keys.ts             # Query key factory
    components/
      ProductCard.vue
      ProductList.vue
      ProductForm.vue
    composables/
      useProducts.ts              # Pinia Colada queries
      useProductMutations.ts      # Pinia Colada mutations
    types/
      product.types.ts            # Feature-specific types (client only)
    index.ts                      # Public exports
  orders/
    ...

shared/                           # Cross-cutting client concerns
  components/                     # UI primitives, layouts
  composables/                    # Global composables
  types/                          # Shared types (client + server)
  utils/                          # Helper functions

server/
  features/                       # Server-side feature slices
    auth/
      auth.service.ts
      auth.guard.ts
      session.utils.ts
    products/
      product.service.ts
  infrastructure/                 # Framework/library abstractions
    database/
      client.ts                   # Drizzle client
      item-service.ts             # Generic CRUD service
  database/
    schema/                       # Drizzle schema definitions
      users.ts
      sessions.ts
      products.ts
      index.ts
  api/                            # Thin HTTP handlers (Nuxt requirement)
    auth/
      register.post.ts
      login.post.ts
      logout.post.ts
      session.get.ts
    products/
      index.get.ts
      index.post.ts
      [id].get.ts
      [id].put.ts
      [id].delete.ts
  middleware/
    auth.ts                       # Session injection
  utils/
    container.ts                  # Dependency injection composition root

app/pages/                            # Nuxt routing (thin, orchestration only)
  products/
    index.vue
    [id].vue
```

---

## 3. Server Architecture

### 3.1 Dependency Injection Pattern

Use **factory functions** returning objects. No classes needed. No DI library needed.

**Factory Function**: Function accepting dependencies, returning service object with methods. Closure captures dependencies.

**Composition Root**: Single file (container.ts) where all services instantiated and wired together. Only place dependencies resolved.

**Lazy Initialization**: Wrap factory calls in lazy helper. Services created on first access, not at startup. Reduces cold start time.

### 3.2 Service Layers

**API Route (Handler)**
- Located: server/api/
- Responsibility: HTTP concerns only
- Actions: Parse request, validate input shape, call service, return response
- Contains: No business logic, no direct database access
- Pattern: One handler per HTTP method per resource

**Feature Service**
- Located: server/features/{feature}/
- Responsibility: Business logic, orchestration
- Actions: Validation rules, transformations, authorization checks, multi-step operations
- Receives: ItemService instances via constructor injection
- Returns: Domain objects, throws HTTP errors for client feedback

**ItemService (Generic)**
- Located: server/infrastructure/database/
- Responsibility: Type-safe CRUD operations
- Actions: Query building, filtering, sorting, pagination, relations
- Pattern: One instance per database table, created in container

### 3.3 ItemService Capabilities

Directus-inspired generic data access layer wrapping Drizzle ORM.

**Filter Operators**
- Equality: _eq, _neq
- Comparison: _gt, _gte, _lt, _lte
- Arrays: _in, _nin
- Text: _like, _ilike
- Null: _null, _nnull
- Logic: _and, _or (nestable)

**Query Options**
- filter: Object with field conditions
- sort: Array of field names, prefix with "-" for descending
- limit: Number of records
- offset: Skip records (pagination)
- fields: Directus-style field selection including relations

**Relation Support**
- Field syntax: "author.*", "categories.category.name"
- Deep filtering: Apply filters to nested relations
- Deep sorting/limiting: Control nested result sets

**Relation Mutations**
- sync: Replace all related items
- attach: Add related items
- detach: Remove related items

**Methods**
- findMany(options): Query multiple records
- findOne(idOrFilter, options): Query single record
- create(data): Insert record
- createMany(data[]): Bulk insert
- update(id, data): Partial update
- updateMany(filter, data): Bulk update
- delete(id): Remove record
- deleteMany(filter): Bulk remove
- count(filter): Count records

### 3.4 Database Schema

Use Drizzle ORM with PostgreSQL.

**Schema Location**: server/database/schema/

**Conventions**
- One file per table/entity
- Export table definition and relations separately
- Use text IDs with UUID default
- Include createdAt/updatedAt timestamps
- Define relations using Drizzle relations() helper
- Junction tables for many-to-many relationships

**Re-export**: Central index.ts re-exports all schemas for clean imports.

---

## 4. Client Architecture

### 4.1 Feature API Layer

**API Module** (features/{feature}/api/{feature}.api.ts)
- Contains: All $fetch calls for feature
- Pattern: Object with methods, each method one endpoint
- Returns: Typed promises
- Handles: HTTP method, path, body/query serialization

**Query Keys** (features/{feature}/api/{feature}.keys.ts)
- Contains: Query key factory object
- Pattern: Hierarchical keys using as const
- Methods: all, lists(), list(filter), details(), detail(id)
- Purpose: Consistent cache keys, granular invalidation

### 4.2 Pinia Colada Integration

**Queries** (features/{feature}/composables/use{Feature}.ts)
- One composable per query type
- Accept reactive parameters (MaybeRefOrGetter)
- Return useQuery result
- Key: Use query key factory
- Query: Call API module method

**Mutations** (features/{feature}/composables/use{Feature}Mutations.ts)
- One composable per mutation type
- Return useMutation result
- onSuccess: Invalidate relevant query keys
- onSuccess: Optionally update cache directly with setQueryData

**Cache Invalidation Strategy**
- After create: Invalidate list queries
- After update: Invalidate lists + update detail cache directly
- After delete: Invalidate lists + remove detail from cache

### 4.3 Feature Exports

**Index File** (features/{feature}/index.ts)
- Export all public components
- Export all composables
- Export API module if needed externally
- Export types
- Do NOT export internal utilities

### 4.4 Pages

**Responsibility**: Route handling, feature orchestration

**Pattern**
- Import from feature index only
- Call composables for data
- Handle loading/error states
- Pass data to feature components
- Handle events from components, delegate to mutations

**Avoid**: Business logic, direct API calls, complex computed properties

---

## 5. Authentication System

### 5.1 Architecture

Self-implemented email/password authentication. No external library.

**Components**
- Auth Service: Registration, login, session management
- Session Utils: Cookie handling
- Auth Guard: Route protection helper
- Auth Middleware: Session injection into request context

### 5.2 Database Schema

**Users Table**
- id: Primary key (UUID)
- email: Unique, required
- passwordHash: bcrypt/argon2 hash, required
- name: Optional display name
- emailVerified: Boolean flag
- createdAt, updatedAt: Timestamps

**Sessions Table**
- id: Primary key (UUID)
- userId: Foreign key to users
- token: Unique session token (32 bytes, hex encoded)
- expiresAt: Timestamp for session expiry
- createdAt: Timestamp

### 5.3 Auth Service Methods

**register(email, password, name?)**
1. Check email uniqueness
2. Hash password (bcrypt, cost 12)
3. Create user record
4. Create session
5. Return session + token

**login(email, password)**
1. Find user by email
2. Verify password against hash
3. Create session
4. Return session + token

**createSession(userId)**
1. Generate random token (crypto.randomBytes)
2. Set expiry (30 days default)
3. Store session record
4. Return session + token

**validateSession(token)**
1. Find session by token
2. Check expiry
3. Delete if expired
4. Return session with user or null

**invalidateSession(token)**
1. Delete session record

### 5.4 Session Cookie Handling

**Cookie Configuration**
- Name: auth_session (configurable)
- httpOnly: true (no JS access)
- secure: true in production
- sameSite: lax
- maxAge: Match session expiry
- path: /

**Utils**
- setSessionCookie: Set cookie after login/register
- getSessionToken: Read token from cookie
- clearSessionCookie: Delete cookie on logout

### 5.5 Middleware

**Server Middleware** (server/middleware/auth.ts)
- Runs on every request
- Reads session token from cookie
- Validates session via auth service
- Injects session + user into event.context
- Does NOT block requests (null if no session)

**Auth Guard** (server/features/auth/auth.guard.ts)
- Used in route handlers
- Throws 401 if no user in context
- Returns user for use in handler

### 5.6 API Routes

**POST /api/auth/register**
- Input: email, password, name?
- Output: user object
- Side effect: Set session cookie

**POST /api/auth/login**
- Input: email, password
- Output: user object
- Side effect: Set session cookie

**POST /api/auth/logout**
- Input: None (reads cookie)
- Output: success confirmation
- Side effect: Invalidate session, clear cookie

**GET /api/auth/session**
- Input: None (reads cookie)
- Output: user object or null
- Purpose: Client session check

### 5.7 Client Integration

**Auth Composable** (features/auth/composables/useAuth.ts)
- State: user (useState), loading (useState)
- Methods: fetch, login, register, logout
- Computed: isAuthenticated
- Pattern: Not Pinia Colada (special case, global state)

**Auth Plugin** (plugins/auth.ts)
- Runs on app init
- Calls auth.fetch() to hydrate session state

**Route Protection**
- Use Nuxt middleware for protected pages
- Check isAuthenticated, redirect to login if false

---

## 6. Configuration

### 6.1 Nuxt Config

**Auto-imports**
- Add: features/**/composables to imports.dirs
- Add: features/**/stores to imports.dirs
- Add: shared/composables to imports.dirs

**Components**
- Add: ~/features with pathPrefix: false
- Add: ~/shared/components with pathPrefix: false

**Nitro Imports** (optional)
- Add: ./server/features/**/ for auto-importing services

### 6.2 TypeScript

Strict mode enabled. Drizzle provides full type inference.

### 6.3 Environment

**Required Variables**
- DATABASE_URL: PostgreSQL connection string
- NODE_ENV: development/production (affects cookie security)

---

## 7. Testing Strategy

### 7.1 Unit Tests

**Services**: Inject mock ItemService instances. Test business logic in isolation.

**Composables**: Mock API layer. Test reactive behavior.

**Components**: Mount with mock composables. Test rendering and events.

### 7.2 Integration Tests

**API Routes**: Test with real database (test container). Verify full request/response cycle.

**ItemService**: Test against real PostgreSQL. Verify queries produce correct SQL.

---

## 8. Adding a New Feature

### Checklist

1. **Schema**: Create table definition in server/database/schema/
2. **ItemService**: Add instance to container.items
3. **Feature Service**: Create in server/features/{feature}/
4. **Wire Service**: Add to container
5. **API Routes**: Create handlers in server/api/{feature}/
6. **Client API**: Create api module in features/{feature}/api/
7. **Query Keys**: Create key factory
8. **Composables**: Create query and mutation composables
9. **Components**: Build feature-specific UI
10. **Index**: Export public API from features/{feature}/index.ts
11. **Pages**: Create routes consuming feature

### Conventions

- Feature names: Plural (products, orders, users)
- Service methods: Verb-first (getAll, getById, create, update, delete)
- Composables: use-prefix (useProducts, useCreateProduct)
- Query keys: Feature-scoped, hierarchical
- API paths: RESTful, resource-based

---

## 9. Key Decisions Summary

| Concern | Decision | Rationale |
|---------|----------|-----------|
| DI Pattern | Factory functions | No deps, great TS inference, testable |
| ORM | Drizzle | Type-safe, SQL-like, good DX |
| Client State | Pinia Colada | Caching, deduplication, simpler than TanStack |
| Auth | Self-implemented | Full control, fits slice architecture |
| Data Access | Generic ItemService | Directus-style ergonomics, type-safe |
| Code Organization | Vertical slices | Feature cohesion, team scalability |
| Pages | Thin orchestration | Features own logic, pages compose |
| API Routes | Thin handlers | Services own logic, handlers do HTTP |

---

## 10. Anti-Patterns to Avoid

- Business logic in API routes
- Direct database queries in routes (bypass ItemService/services)
- Cross-feature imports bypassing index.ts
- Shared state outside composables
- Complex computed logic in pages
- API calls from components (use composables)
- Hardcoded query keys (use factory)
- Missing cache invalidation after mutations
- Session validation in every route (use middleware + guard)
- Mixing client and server types without shared/ layer