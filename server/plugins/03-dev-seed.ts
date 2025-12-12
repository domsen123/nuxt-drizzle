import { faker } from '@faker-js/faker'
import { container } from '../utils/container'

const DEV_PASSWORD = 'password123'
const USER_COUNT = 200
const ORG_COUNT = 100

const seedOrganisations = async () => {
  console.log(`[Dev Seed] Creating ${ORG_COUNT} organisations...`)

  const slugs = new Set<string>()
  const orgs = []

  for (let i = 0; i < ORG_COUNT; i++) {
    const name = faker.company.name()
    let slug = faker.helpers.slugify(name).toLowerCase()

    // Ensure unique slugs
    while (slugs.has(slug)) {
      slug = `${slug}-${faker.string.alphanumeric(4)}`
    }
    slugs.add(slug)

    orgs.push({ name, slug })
  }

  const created = await container.items.organisations.createMany(orgs)
  console.log(`[Dev Seed] Created ${created.length} organisations`)
  return created
}

const seedUsers = async () => {
  console.log(`[Dev Seed] Creating ${USER_COUNT} users...`)

  const emails = new Set<string>()
  const users = []

  for (let i = 0; i < USER_COUNT; i++) {
    let email = faker.internet.email().toLowerCase()

    // Ensure unique emails
    while (emails.has(email)) {
      email = faker.internet.email().toLowerCase()
    }
    emails.add(email)

    const name = faker.person.fullName()

    // Use authService.register for proper password hashing
    const { user } = await container.authService.register(email, DEV_PASSWORD, name)
    users.push(user)

    // Log progress every 50 users
    if ((i + 1) % 50 === 0) {
      console.log(`[Dev Seed] Created ${i + 1}/${USER_COUNT} users...`)
    }
  }

  console.log(`[Dev Seed] Created ${users.length} users`)
  return users
}

const seedMemberships = async (
  users: { id: string }[],
  organisations: { id: string }[],
) => {
  console.log('[Dev Seed] Creating organisation memberships...')

  const memberships = []
  const existingPairs = new Set<string>()

  for (const user of users) {
    // Each user gets 1-3 random organisations
    const orgCount = faker.number.int({ min: 1, max: 3 })
    const userOrgs = faker.helpers.arrayElements(organisations, orgCount)

    for (const org of userOrgs) {
      const pairKey = `${user.id}-${org.id}`
      if (existingPairs.has(pairKey))
        continue
      existingPairs.add(pairKey)

      memberships.push({
        userId: user.id,
        organisationId: org.id,
        role: faker.helpers.arrayElement(['member', 'admin']),
      })
    }
  }

  const created = await container.items.organisationMembers.createMany(memberships)
  console.log(`[Dev Seed] Created ${created.length} organisation memberships`)
  return created
}

export default defineNitroPlugin(async () => {
  // Only run in development mode
  if (!import.meta.dev) {
    return
  }

  console.log('[Dev Seed] Checking if seeding is needed...')

  // Check if already seeded (users > 1 accounts for admin user)
  const userCount = await container.items.users.count()
  const orgCount = await container.items.organisations.count()

  if (userCount > 1 || orgCount > 0) {
    console.log(`[Dev Seed] Skipping - database already has data (${userCount} users, ${orgCount} organisations)`)
    return
  }

  console.log('[Dev Seed] Starting development data seeding...')

  const organisations = await seedOrganisations()
  const users = await seedUsers()
  await seedMemberships(users, organisations)

  console.log('[Dev Seed] Development seeding complete!')
})
