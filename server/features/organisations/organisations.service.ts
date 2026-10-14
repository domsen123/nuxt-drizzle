import type { organisations, roles, users } from '~~/server/database/schema'
import type { ItemService } from '~~/server/infrastructure/database/item-service'
import type { OrganisationMembersService } from '../organisation-members/organisation-members.service'
import type { CreateOrganisationInput, OrganisationWithOwner } from './organisations.types'
import { createError } from 'nuxt/server'
import { getSystemRoleId } from '../rbac/rbac.seed'

export interface CreateOrganisationsServiceDeps {
  organisationsItemService: ItemService<typeof organisations>
  rolesItemService: ItemService<typeof roles>
  usersItemService: ItemService<typeof users>
  organisationMembersService: OrganisationMembersService
}

export const createOrganisationsService = (deps: CreateOrganisationsServiceDeps) => {
  const {
    organisationsItemService,
    rolesItemService,
    usersItemService,
    organisationMembersService,
  } = deps

  /**
   * Create an organisation and automatically assign the creator as Owner
   */
  const create = async (input: CreateOrganisationInput): Promise<OrganisationWithOwner> => {
    const { name, slug, creatorUserId } = input

    // Verify creator user exists
    const creator = await usersItemService.readOne(creatorUserId)
    if (!creator) {
      throw createError({ status: 404, statusText: 'Creator user not found', data: { code: 'organisations.creator_not_found' } })
    }

    // Check slug uniqueness
    const existing = await organisationsItemService.findOne({
      slug: { _eq: slug },
    })
    if (existing) {
      throw createError({ status: 409, statusText: 'An organisation with this slug already exists', data: { code: 'organisations.slug_exists' } })
    }

    // Create the organisation
    const organisation = await organisationsItemService.create({ name, slug })

    // Get the Owner role ID
    const ownerRoleId = await getSystemRoleId(rolesItemService, 'Owner', 'organisation')
    if (!ownerRoleId) {
      throw createError({
        status: 500,
        statusText: 'Owner role not found. Please ensure RBAC has been seeded.',
      })
    }

    // Add creator as owner member
    await organisationMembersService.addMember({
      organisationId: organisation.id,
      userId: creatorUserId,
      roleId: ownerRoleId,
    })

    return {
      id: organisation.id,
      name: organisation.name,
      slug: organisation.slug,
      createdAt: organisation.createdAt,
      updatedAt: organisation.updatedAt,
      owner: {
        id: creator.id,
        email: creator.email,
        name: creator.name,
      },
    }
  }

  return {
    create,
  }
}

export type OrganisationsService = ReturnType<typeof createOrganisationsService>
