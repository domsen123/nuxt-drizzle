import type { organisationInvitations, organisations, roles, users } from '~~/server/database/schema'
import type { EmailService } from '~~/server/features/email/email.service'
import type { OrganisationMembersService } from '~~/server/features/organisation-members/organisation-members.service'
import type { ItemService } from '~~/server/infrastructure/database/item-service'
import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import { config } from '~~/server/utils/config'

const INVITATION_EXPIRY_DAYS = 7
const BCRYPT_COST = 12

export interface CreateOrganisationInvitationsServiceDeps {
  organisationInvitationsItemService: ItemService<typeof organisationInvitations>
  organisationsItemService: ItemService<typeof organisations>
  usersItemService: ItemService<typeof users>
  rolesItemService: ItemService<typeof roles>
  emailService: EmailService
  organisationMembersService: OrganisationMembersService
}

export interface CreateInvitationInput {
  organisationId: string
  email: string
  roleId: string
  invitedByUserId: string
  inviterName?: string
}

export interface AcceptInvitationInput {
  token: string
  password: string
  name?: string
}

export interface AcceptInvitationResult {
  user: { id: string, email: string, name: string | null }
  organisationId: string
  organisationName: string
}

export const createOrganisationInvitationsService = (deps: CreateOrganisationInvitationsServiceDeps) => {
  const {
    organisationInvitationsItemService,
    organisationsItemService,
    usersItemService,
    rolesItemService,
    emailService,
    organisationMembersService,
  } = deps

  /**
   * Create an invitation for a non-existing user to join an organisation
   */
  const createInvitation = async (input: CreateInvitationInput): Promise<{ success: boolean }> => {
    const { organisationId, email, roleId, invitedByUserId, inviterName } = input
    const normalizedEmail = email.toLowerCase().trim()

    // Verify organisation exists
    const org = await organisationsItemService.readOne(organisationId)
    if (!org) {
      throw createError({ statusCode: 404, statusMessage: 'Organisation not found' })
    }

    // Verify role exists and is org-scoped
    const role = await rolesItemService.readOne(roleId)
    if (!role || role.scope !== 'organisation') {
      throw createError({ statusCode: 400, statusMessage: 'Invalid role' })
    }

    // Check if user already exists
    const existingUser = await usersItemService.findOne({ email: normalizedEmail })
    if (existingUser) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User already exists. Use the add member feature instead.',
      })
    }

    // Check for existing invitation (delete if expired)
    const existingInvitation = await organisationInvitationsItemService.findOne({
      email: normalizedEmail,
      organisationId,
    })

    if (existingInvitation) {
      if (new Date(existingInvitation.expiresAt) > new Date()) {
        throw createError({
          statusCode: 409,
          statusMessage: 'An invitation has already been sent to this email',
        })
      }
      // Delete expired invitation
      await organisationInvitationsItemService.delete(existingInvitation.id)
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

    // Create invitation
    await organisationInvitationsItemService.create({
      token,
      email: normalizedEmail,
      organisationId,
      roleId,
      invitedByUserId,
      expiresAt,
    })

    // Send invitation email
    const acceptLink = `${config.site.url}/auth/accept-invitation?token=${token}`

    const result = await emailService.sendOrganisationInvitation(normalizedEmail, {
      organisationName: org.name,
      inviterName,
      acceptLink,
      expiresInDays: INVITATION_EXPIRY_DAYS,
    })

    if (!result.success) {
      // Rollback invitation if email fails
      const inv = await organisationInvitationsItemService.findOne({ token })
      if (inv)
        await organisationInvitationsItemService.delete(inv.id)
      throw createError({ statusCode: 500, statusMessage: 'Failed to send invitation email' })
    }

    console.log(`[Organisation Invitation] Invitation sent to ${normalizedEmail} for org ${org.name}`)

    return { success: true }
  }

  /**
   * Validate an invitation token (for showing acceptance form)
   */
  const validateInvitation = async (token: string): Promise<{
    valid: boolean
    email?: string
    organisationName?: string
  }> => {
    const invitation = await organisationInvitationsItemService.findOne({ token })

    if (!invitation || new Date(invitation.expiresAt) < new Date()) {
      return { valid: false }
    }

    const org = await organisationsItemService.readOne(invitation.organisationId)

    return {
      valid: true,
      email: invitation.email,
      organisationName: org?.name,
    }
  }

  /**
   * Accept an invitation and create the user account
   */
  const acceptInvitation = async (input: AcceptInvitationInput): Promise<AcceptInvitationResult> => {
    const { token, password, name } = input

    const invitation = await organisationInvitationsItemService.findOne({ token })

    if (!invitation) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid invitation token' })
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      throw createError({ statusCode: 400, statusMessage: 'Invitation has expired' })
    }

    const org = await organisationsItemService.readOne(invitation.organisationId)
    if (!org) {
      throw createError({ statusCode: 400, statusMessage: 'Organisation no longer exists' })
    }

    // Check if user was created between invitation and acceptance
    const existingUser = await usersItemService.findOne({ email: invitation.email })
    if (existingUser) {
      await organisationInvitationsItemService.delete(invitation.id)
      throw createError({
        statusCode: 409,
        statusMessage: 'An account with this email already exists. Please sign in.',
      })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST)

    // Create user with email already verified
    const user = await usersItemService.create({
      email: invitation.email,
      passwordHash,
      name: name ?? null,
      emailVerified: true,
    })

    // Add user to organisation with assigned role
    await organisationMembersService.addMember({
      organisationId: invitation.organisationId,
      userId: user.id,
      roleId: invitation.roleId,
    })

    // Delete the invitation (single-use)
    await organisationInvitationsItemService.delete(invitation.id)

    console.log(`[Organisation Invitation] User ${user.email} accepted invitation and joined ${org.name}`)

    return {
      user: { id: user.id, email: user.email, name: user.name },
      organisationId: org.id,
      organisationName: org.name,
    }
  }

  /**
   * Clean up expired invitations
   */
  const cleanupExpiredInvitations = async (): Promise<number> => {
    const expired = await organisationInvitationsItemService.findMany({
      filter: { expiresAt: { _lt: new Date() } },
    })

    for (const inv of expired) {
      await organisationInvitationsItemService.delete(inv.id)
    }

    return expired.length
  }

  return {
    createInvitation,
    validateInvitation,
    acceptInvitation,
    cleanupExpiredInvitations,
  }
}

export type OrganisationInvitationsService = ReturnType<typeof createOrganisationInvitationsService>
