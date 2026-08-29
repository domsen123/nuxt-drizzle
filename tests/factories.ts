import { faker } from '@faker-js/faker'
import { ulid } from 'ulid'

export const createOrganisationData = (overrides = {}) => ({
  name: faker.company.name(),
  slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
  ...overrides,
})

export const createTeamData = (organisationId: string, overrides = {}) => ({
  name: faker.commerce.department(),
  organisationId,
  ...overrides,
})

export const createUserData = (overrides = {}) => ({
  email: faker.internet.email(),
  passwordHash: faker.string.alphanumeric(60),
  name: faker.person.fullName(),
  emailVerified: faker.datatype.boolean(),
  ...overrides,
})

export const createOrganisationMemberData = (organisationId: string, userId: string, overrides = {}) => ({
  organisationId,
  userId,
  ...overrides,
})

export const createTeamMemberData = (teamId: string, userId: string, overrides = {}) => ({
  teamId,
  userId,
  ...overrides,
})

// `server/plugins/01.init.ts` seeds this table at server start. Tests run without
// that plugin, so they insert the rows they need themselves.
export const createAuthProviderData = (provider: string, overrides = {}) => ({
  id: ulid(),
  provider,
  enabled: false,
  config: {},
  displayOrder: 0,
  ...overrides,
})
