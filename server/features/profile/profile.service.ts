import type { users } from '~~/server/database/schema'
import type { ItemService } from '~~/server/infrastructure/database/item-service'
import bcrypt from 'bcrypt'

const BCRYPT_COST = 12

export interface UserProfile {
  id: string
  email: string
  name: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UpdateProfileInput {
  name?: string
  email?: string
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export interface CreateProfileServiceDeps {
  usersItemService: ItemService<typeof users>
}

export const createProfileService = (deps: CreateProfileServiceDeps) => {
  const { usersItemService } = deps

  /**
   * Get user profile by ID
   */
  const getProfile = async (userId: string): Promise<UserProfile | null> => {
    const user = await usersItemService.readOne(userId)

    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  /**
   * Update user profile (name, email)
   */
  const updateProfile = async (
    userId: string,
    input: UpdateProfileInput,
  ): Promise<UserProfile> => {
    const user = await usersItemService.readOne(userId)

    if (!user) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    // If email is being changed, check for uniqueness
    if (input.email && input.email.toLowerCase() !== user.email) {
      const existingUser = await usersItemService.findOne({
        email: input.email.toLowerCase(),
      })

      if (existingUser && existingUser.id !== userId) {
        throw createError({ statusCode: 409, statusMessage: 'Email already in use' })
      }
    }

    const updateData: Partial<{ name: string | null, email: string }> = {}

    if (input.name !== undefined) {
      updateData.name = input.name || null
    }

    if (input.email) {
      updateData.email = input.email.toLowerCase()
    }

    const updatedUser = await usersItemService.update(userId, updateData)

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    }
  }

  /**
   * Change user password
   */
  const changePassword = async (
    userId: string,
    input: ChangePasswordInput,
  ): Promise<{ success: boolean }> => {
    const user = await usersItemService.readOne(userId)

    if (!user) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    // Verify current password
    const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash)

    if (!isValid) {
      throw createError({ statusCode: 401, statusMessage: 'Current password is incorrect' })
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(input.newPassword, BCRYPT_COST)

    // Update password
    await usersItemService.update(userId, {
      passwordHash: newPasswordHash,
    })

    return { success: true }
  }

  return {
    getProfile,
    updateProfile,
    changePassword,
  }
}

export type ProfileService = ReturnType<typeof createProfileService>
