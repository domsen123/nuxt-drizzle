# Nuxt SaaS Starter

A production-ready, full-stack SaaS starter template built with Nuxt 4, featuring multi-tenant organizations, teams, role-based access control, authentication, and more. Built using **vertical slice architecture** for maintainability and scalability.

## Features

- **Authentication System** - Complete auth flow with sign up, sign in, password reset, email verification, and session management
- **Multi-Tenant Organizations** - Create and manage organizations with unique slugs and member management
- **Team Management** - Organize members into teams within organizations
- **Role-Based Access Control (RBAC)** - Polymorphic roles supporting global, organization, and team scopes with 27+ permissions
- **Invitation System** - Invite users to organizations via email with token-based acceptance
- **Admin Impersonation** - Super admins can impersonate users for debugging and support
- **User Profile Management** - Update profile, change password, and email change workflow
- **Admin Dashboard** - Manage all organizations, users, teams, and view platform statistics
- **Event Bus** - Event-driven architecture for loose coupling between features
- **Email System** - Pluggable email providers with template support (LiquidJS)

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Nuxt 4.2.2 (Vue 3) |
| **UI** | Nuxt UI 4 + Tailwind CSS |
| **Database** | PostgreSQL + Drizzle ORM |
| **State** | Pinia + Pinia Colada (server-state caching) |
| **Validation** | Zod v4 |
| **Email** | Nodemailer + LiquidJS templates |
| **Testing** | Vitest |
| **Package Manager** | pnpm 10.23.0 |
| **Node** | 22+ |

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 10.23.0+
- Docker (for PostgreSQL)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd nuxt-drizzle

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start PostgreSQL
pnpm docker:up

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Commands

```bash
# Development
pnpm dev                    # Start dev server (localhost:3000)
pnpm lint                   # Run ESLint
pnpm lint:fix               # Fix lint issues
pnpm typecheck              # TypeScript checking

# Build
pnpm build                  # Production build
pnpm preview                # Preview production build

# Database (PostgreSQL via Docker)
pnpm docker:up              # Start PostgreSQL container
pnpm docker:clean           # Clean/rebuild containers
pnpm db:push                # Push schema to database
pnpm db:generate            # Generate migrations
pnpm db:studio              # Open Drizzle Studio UI

# Testing
pnpm test                   # Run tests in watch mode
pnpm test:run               # Run tests once
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Site Configuration
NUXT_SITE_NAME="Your App Name"
NUXT_SITE_ENV="development"
NUXT_PUBLIC_SITE_URL="http://localhost:3000"

# Database (PostgreSQL)
NUXT_DATABASE_HOST=localhost
NUXT_DATABASE_PORT=5432
NUXT_DATABASE_USER=postgres
NUXT_DATABASE_PASSWORD=postgres
NUXT_DATABASE_NAME=nuxt-starter

# Authentication
NUXT_AUTH_SECRET=<generate-a-random-secret>

# Email Provider (console|smtp)
NUXT_EMAIL_PROVIDER=console

# SMTP Settings (when using smtp provider)
NUXT_SMTP_HOST=smtp.example.com
NUXT_SMTP_PORT=587
NUXT_SMTP_USER=user@example.com
NUXT_SMTP_PASS=password
NUXT_SMTP_FROM=noreply@example.com
```

## Architecture

This project follows **vertical slice architecture** - features are organized as self-contained slices rather than horizontal layers.

### Directory Structure

```
├── app/                          # Nuxt client-side application
│   ├── features/                 # Feature slices
│   │   ├── auth/                 # Authentication feature
│   │   ├── profile/              # User profile management
│   │   ├── organisations/        # Organization management
│   │   ├── organisation-members/ # Member management
│   │   ├── organisation-invitations/ # Invitation handling
│   │   ├── permissions/          # Client-side permission checking
│   │   └── admin/                # Admin dashboard
│   ├── components/               # Shared global components (App-prefixed)
│   ├── layouts/                  # Page layouts (default, auth, admin)
│   ├── pages/                    # File-based routing
│   └── utils/                    # Client utilities
│
├── server/                       # Nitro backend
│   ├── features/                 # Feature services
│   │   ├── auth/                 # Auth service, tokens, sessions
│   │   ├── email/                # Email service, providers, templates
│   │   ├── impersonation/        # Admin impersonation
│   │   ├── organisations/        # Organization CRUD
│   │   ├── organisation-invitations/ # Invitation service
│   │   ├── organisation-members/ # Member management
│   │   ├── profile/              # Profile service
│   │   └── rbac/                 # Role-based access control
│   ├── database/
│   │   ├── schema/               # Drizzle ORM schemas
│   │   └── migrations/           # Generated migrations
│   ├── infrastructure/
│   │   ├── database/             # Database client, ItemService
│   │   └── events/               # Event bus implementation
│   ├── middleware/               # Auth middleware
│   ├── api/                      # API routes (thin, delegate to services)
│   └── utils/                    # Server utilities, DI container
│
└── shared/                       # Cross-cutting types and utilities
```

### Feature Slice Structure

Each feature slice contains:

```
feature/
├── api/                # API client wrappers & query keys
├── composables/        # Vue 3 composables (queries + mutations)
├── components/         # Vue SFC components
├── types/              # TypeScript interfaces
└── index.ts            # Public exports
```

## Feature Documentation

### Authentication

Complete authentication system with session-based auth using httpOnly cookies.

**Capabilities:**
- User registration with email/password
- Email verification (24-hour token expiry)
- Sign in with "Remember me" option (30 days vs 1 day)
- Password reset flow (1-hour token expiry)
- Session management (view, revoke individual or all sessions)
- Sliding window session refresh

**API Endpoints:**
```
POST   /api/auth/register              # User registration
POST   /api/auth/login                 # User login
POST   /api/auth/logout                # Session logout
POST   /api/auth/forgot-password       # Request password reset
GET    /api/auth/validate-reset-token  # Check reset token validity
POST   /api/auth/reset-password        # Complete password reset
POST   /api/auth/resend-verification   # Resend email verification
GET    /api/auth/verify-email          # Verify email address
GET    /api/auth/session               # Get current session/user
GET    /api/auth/sessions              # List all user sessions
DELETE /api/auth/sessions/[id]         # Revoke specific session
DELETE /api/auth/sessions/others       # Revoke all other sessions
```

**Security Features:**
- Passwords hashed with bcrypt (cost 12)
- Cryptographically random session tokens (32 bytes)
- httpOnly, Secure (production), SameSite=Lax cookies
- Single-use verification tokens
- Email enumeration prevention on password reset

### Organizations & Teams

Multi-tenant organization system with team support.

**Organization Features:**
- Create organizations with unique slugs
- Add/remove members
- Assign roles to members
- Cascade delete (members, teams, invitations)

**Team Features:**
- Create teams within organizations
- Add/remove team members
- Team-level role assignments
- Organize members by project/department

**API Endpoints:**
```
POST   /api/organisations                              # Create organization
GET    /api/organisations/[orgId]/members              # List org members
POST   /api/organisations/[orgId]/members              # Add member
GET    /api/organisations/[orgId]/teams                # List org teams
POST   /api/organisations/[orgId]/teams                # Create team
GET    /api/organisations/[orgId]/teams/[teamId]       # Get team details
PUT    /api/organisations/[orgId]/teams/[teamId]       # Update team
DELETE /api/organisations/[orgId]/teams/[teamId]       # Delete team
GET    /api/organisations/[orgId]/teams/[teamId]/members    # List team members
POST   /api/organisations/[orgId]/teams/[teamId]/members    # Add team member
DELETE /api/organisations/[orgId]/teams/[teamId]/members/[userId]  # Remove member
```

### Role-Based Access Control (RBAC)

Sophisticated permission system with polymorphic roles supporting multiple scopes.

**Permission Scopes:**
- **Global** - Platform-wide permissions (Super Admin)
- **Organisation** - Organization-level permissions (Owner, Admin, Member)
- **Team** - Team-level permissions (Lead, Member)

**System Roles:**

| Role | Scope | Description | Default |
|------|-------|-------------|---------|
| Super Admin | Global | Full platform access | No |
| User | Global | Can create organizations | Yes (assigned on signup) |
| Owner | Organisation | Full organization control | No |
| Admin | Organisation | Manage members, teams, roles | No |
| Member | Organisation | Read access | Yes |
| Lead | Team | Full team control | No |
| Member | Team | View team, manage tasks | Yes |

**Permissions (27 total):**

```
# Global
platform:admin              # Full platform access
organisation:create         # Create organizations

# Organisation
organisation:read           # View organization
organisation:update         # Update organization settings
organisation:delete         # Delete organization
organisation:member:view    # View members
organisation:member:invite  # Invite members
organisation:member:remove  # Remove members
organisation:member:role:assign  # Assign roles
organisation:role:create    # Create custom roles
organisation:role:update    # Update roles
organisation:role:delete    # Delete roles
organisation:team:create    # Create teams
organisation:team:view      # View teams
organisation:team:delete    # Delete teams
organisation:billing:view   # View billing
organisation:billing:manage # Manage billing

# Team
team:read                   # View team
team:update                 # Update team
team:delete                 # Delete team
team:member:view            # View team members
team:member:add             # Add team members
team:member:remove          # Remove team members
team:member:role:assign     # Assign team roles
```

**Permission Check Example:**
```typescript
// In API route
await requirePermission(event, {
  permission: PERMISSIONS.ORGANISATION_MEMBER_INVITE,
  scope: 'organisation',
  getScopeId: (event) => getRouterParam(event, 'orgId')
})
```

### Invitation System

Token-based invitation system for adding users to organizations.

**Flow:**
1. Admin invites user by email
2. System sends invitation email with unique token
3. User receives email and clicks acceptance link
4. User creates account (or links existing) and is added to organization
5. User automatically receives assigned role

**Features:**
- 7-day token expiry
- Unique constraint per email per organization
- Resend invitation capability
- Revoke pending invitations
- Email pre-verified on acceptance

**API Endpoints:**
```
GET    /api/auth/invitations/[token]/validate      # Validate invitation
POST   /api/auth/invitations/[token]/accept        # Accept invitation
GET    /api/admin/organisations/[id]/invitations   # List invitations
POST   /api/admin/organisations/[id]/invitations   # Create invitation
DELETE /api/admin/organisations/[id]/invitations/[invitationId]  # Revoke
POST   /api/admin/organisations/[id]/invitations/[invitationId]/resend  # Resend
```

### Admin Impersonation

Super admins can impersonate any user for debugging and support.

**Features:**
- Creates separate session with 4-hour expiry
- Original admin session preserved
- Cannot impersonate yourself
- Clear UI indication of impersonation state
- Return to original session when stopped

**API Endpoints:**
```
POST   /api/admin/users/[id]/impersonate     # Start impersonation
POST   /api/auth/impersonation/stop          # Stop impersonation
```

### User Profile Management

Complete profile management with secure email change workflow.

**Features:**
- Update profile name
- Change password (requires current password)
- Email change with verification to NEW email
- View and cancel pending email changes

**API Endpoints:**
```
GET    /api/profile                          # Get current user profile
PUT    /api/profile                          # Update profile (name)
PUT    /api/profile/password                 # Change password
POST   /api/profile/email/request-change     # Request email change
GET    /api/profile/email/pending            # Get pending email change
GET    /api/profile/email/confirm            # Confirm email change
DELETE /api/profile/email/cancel             # Cancel email change
```

### Admin Dashboard

Full administrative capabilities for platform management.

**Features:**
- View platform statistics (users, orgs, teams)
- Manage all organizations (CRUD)
- Manage all users (CRUD)
- Manage all teams (CRUD)
- Handle invitations
- Impersonate users

**API Endpoints:**
```
GET    /api/admin/stats                           # Platform statistics
GET    /api/admin/organisations                   # List all orgs
POST   /api/admin/organisations                   # Create org
GET    /api/admin/organisations/[id]              # Get org details
PUT    /api/admin/organisations/[id]              # Update org
DELETE /api/admin/organisations/[id]              # Delete org
GET    /api/admin/organisations/[id]/teams        # List org teams
POST   /api/admin/organisations/[id]/teams        # Create team
GET    /api/admin/organisations/[id]/members      # List org members
POST   /api/admin/organisations/[id]/members      # Add member
GET    /api/admin/users                           # List all users
GET    /api/admin/users/[id]                      # Get user details
PUT    /api/admin/users/[id]                      # Update user
DELETE /api/admin/users/[id]                      # Delete user
```

### Event Bus

Event-driven architecture for decoupling features.

**Event Types:**
```typescript
'auth:user-registered'    // Fired on signup (triggers role assignment)
'[tableName]:created'     // e.g., 'users:created'
'[tableName]:updated'     // e.g., 'organisations:updated'
'[tableName]:deleted'     // e.g., 'sessions:deleted'
```

**Usage:**
```typescript
// Emit event
eventBus.emit('users:created', { data: user, operation: 'created' })

// Listen for events
eventBus.on('auth:user-registered', async (user) => {
  await assignDefaultRole(user.id)
})
```

### Email System

Pluggable email system with template support.

**Providers:**
- `console` - Logs to console (development)
- `smtp` - Nodemailer SMTP transport (production)

**Templates:**
- Password reset
- Email verification
- Email change confirmation
- Organization invitation

**Template Engine:** LiquidJS with variables like `{{ siteName }}`, `{{ userName }}`, `{{ resetLink }}`

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts |
| `sessions` | Active sessions (supports impersonation) |
| `organisations` | Multi-tenant organizations |
| `organisation_members` | Org membership junction |
| `organisation_invitations` | Pending invitations |
| `teams` | Teams within organizations |
| `team_members` | Team membership junction |
| `roles` | Role definitions |
| `role_permissions` | Permissions per role |
| `user_roles` | User-to-role assignments |
| `email_verification_tokens` | Email verification |
| `password_reset_tokens` | Password reset |
| `pending_email_changes` | Email change workflow |

### ID Format

All tables use ULID (Universally Unique Lexicographically Sortable Identifier) for primary keys.

## Key Patterns

### Dependency Injection

Factory pattern with lazy initialization in `server/utils/container.ts`:

```typescript
const getAuthService = lazy(() => createAuthService({
  usersService: container.items.users,
  sessionsService: container.items.sessions,
  emailService: container.emailService,
  eventBus: container.eventBus,
}))
```

### ItemService

Generic CRUD service with type-safe filtering:

```typescript
// Create
const user = await usersService.create({ email, passwordHash, name })

// Find with filters
const users = await usersService.findMany({
  filter: {
    organisationId: { _eq: orgId },
    createdAt: { _gte: lastMonth }
  },
  sort: ['-createdAt'],
  limit: 10
})

// Filter operators: _eq, _neq, _gt, _gte, _lt, _lte, _in, _nin, _like, _ilike, _null, _nnull
// Logical: _and, _or
```

### Permission Guards

```typescript
// Require authentication
const user = requireAuth(event)

// Require specific permission
await requirePermission(event, {
  permission: PERMISSIONS.ORGANISATION_UPDATE,
  scope: 'organisation',
  getScopeId: (event) => getRouterParam(event, 'orgId')
})

// Require super admin
await requireSuperAdmin(event)
```

### Pinia Colada Queries

```typescript
const { data, isLoading, error } = useQuery({
  key: authKeys.session(),
  query: () => useAuthApi().getSession()
})
```

## Pages

| Path | Description |
|------|-------------|
| `/` | Home/dashboard |
| `/auth/sign-in` | Login page |
| `/auth/sign-up` | Registration page |
| `/auth/forgot-password` | Password reset request |
| `/auth/reset-password` | Reset password form |
| `/auth/verify-email` | Email verification |
| `/auth/confirm-email` | Confirm email change |
| `/auth/accept-invitation` | Accept org invitation |
| `/settings/` | User profile settings |
| `/admin/organisations` | Admin: Organization management |
| `/admin/organisations/[id]` | Admin: Organization details |
| `/admin/teams` | Admin: Team management |
| `/admin/teams/[id]` | Admin: Team details |
| `/admin/users` | Admin: User management |
| `/admin/users/[id]` | Admin: User details |

## Security

### Authentication Security
- Passwords hashed with bcrypt (cost factor 12)
- Cryptographically random session tokens (32 bytes)
- httpOnly cookies prevent XSS token theft
- Secure flag in production
- SameSite=Lax prevents CSRF

### Authorization Security
- Permission checks on all protected routes
- Scope validation ensures users access only their resources
- Super admin bypass for platform operations
- Request-scoped permission caching

### Input Validation
- Zod schemas validate all API inputs
- Email normalization (lowercase, trim)
- Field constraints (min/max lengths)

## Testing

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run
```

Test files are located in `tests/` directory with factories for creating test data.

## Extending the Project

### Adding a New Feature

1. Create feature directory in `app/features/[feature-name]/`
2. Add components, composables, types, and API wrappers
3. Create server feature in `server/features/[feature-name]/`
4. Add API routes in `server/api/`
5. Register services in `server/utils/container.ts`
6. Add database schema in `server/database/schema/`

### Adding a New Permission

1. Add permission constant in `server/features/rbac/permissions.ts`
2. Assign to appropriate roles in seed data
3. Use `requirePermission()` in API routes

### Adding a New Role

1. Add role to system roles in `server/features/rbac/service.ts`
2. Assign permissions to the role
3. Update RBAC documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the vertical slice architecture
4. Run `pnpm lint` and `pnpm typecheck`
5. Submit a pull request

## License

[MIT](LICENSE)
