# Phase 01: Test Infrastructure Setup

This phase establishes the foundation for comprehensive testing with a real PostgreSQL database. By the end, you will have a working test environment that runs actual database operations, ensuring tests reflect real-world behavior. This is the critical foundation that enables all subsequent testing phases.

## Tasks

- [x] Create test environment configuration:
  - Create `.env.test` in project root with test database settings:
    ```
    NUXT_DATABASE_HOST="localhost"
    NUXT_DATABASE_PORT="5433"
    NUXT_DATABASE_USER="postgres"
    NUXT_DATABASE_PASSWORD="postgres"
    NUXT_DATABASE_NAME="nuxt-starter-test"
    NUXT_AUTH_SECRET="test-secret-key-for-testing-only"
    NUXT_SITE_NAME="Test App"
    NUXT_PUBLIC_SITE_URL="http://localhost:3000"
    NUXT_EMAIL_PROVIDER="console"
    ```
  - Create `docker-compose.test.yml` with PostgreSQL 16 on port 5433 (to avoid conflict with dev DB on 5432)
  - Add npm scripts to `package.json`:
    - `"docker:test:up": "docker compose -f docker-compose.test.yml up -d"`
    - `"docker:test:down": "docker compose -f docker-compose.test.yml down -v"`
    - `"test:db:push": "dotenv -e .env.test -- drizzle-kit push"`

- [ ] Update Vitest configuration for test database:
  - Modify `tests/setup.ts` to load `.env.test` using dotenv before any imports
  - Ensure the database client reads from the test environment variables
  - Extend the TRUNCATE statement to include all tables: `users, sessions, organisations, organisation_members, teams, team_members, roles, role_permissions, user_roles, password_reset_tokens, email_verification_tokens, pending_email_changes, organisation_invitations`

- [ ] Create comprehensive test factory utilities:
  - Extend `tests/factories.ts` with factories for all entity types:
    - `createSessionData(userId, overrides)` - for session records
    - `createRoleData(scope, overrides)` - for role records
    - `createRolePermissionData(roleId, permission)` - for role-permission mappings
    - `createUserRoleData(userId, roleId, scope, scopeId)` - for user role assignments
    - `createPasswordResetTokenData(userId)` - with proper expiry
    - `createEmailVerificationTokenData(userId)` - with proper expiry
    - `createPendingEmailChangeData(userId, newEmail)` - with proper expiry
    - `createOrganisationInvitationData(organisationId, email, roleId, invitedByUserId)` - with proper expiry
  - Add helper to create valid bcrypt password hashes for test users

- [ ] Create test database seeding utilities:
  - Create `tests/seed-helpers.ts` with functions to seed common test scenarios:
    - `seedTestUser(db)` - creates a user with hashed password
    - `seedTestOrganisation(db, ownerId)` - creates org with owner membership
    - `seedRbacRoles(db)` - seeds the system roles (Super Admin, Owner, Admin, Member, Viewer)
    - `seedFullTestContext(db)` - creates a complete test scenario with user, org, roles, and memberships
  - These helpers should use the actual service factories where appropriate for realistic data

- [ ] Verify test infrastructure works end-to-end:
  - Create `tests/infrastructure.test.ts` with basic smoke tests:
    - Test that database connection works
    - Test that table truncation works
    - Test that factory data can be inserted and queried
    - Test that seed helpers create expected data
  - Run `pnpm docker:test:up && pnpm test:db:push && pnpm test:run tests/infrastructure.test.ts`
  - Ensure all smoke tests pass before proceeding to Phase 02
