import type { ColorMode, NeutralColor, PrimaryColor, UserPreferences } from '~~/shared/user-preferences.constants'
import { useSession } from '~/features/auth'
import { useApplyPreferences } from './useApplyPreferences'
import { useUpdatePreferences } from './useProfileMutations'

export const useAppearance = () => {
  const colorMode = useColorMode()
  const appConfig = useAppConfig()
  const { user, isAnonymous, isImpersonating } = useSession()

  const applyPreferences = useApplyPreferences()
  const { mutate: updatePreferences } = useUpdatePreferences()

  const currentColorMode = computed(() => colorMode.preference as ColorMode)
  const currentPrimaryColor = computed(() => appConfig.ui.colors.primary as PrimaryColor)
  const currentNeutralColor = computed(() => appConfig.ui.colors.neutral as NeutralColor)

  /**
   * Applies the selection immediately. Persists it only for signed-in,
   * non-anonymous users outside an active impersonation.
   */
  const setAppearance = (input: UserPreferences) => {
    applyPreferences({
      colorMode: input.colorMode ?? currentColorMode.value,
      primaryColor: input.primaryColor ?? currentPrimaryColor.value,
      neutralColor: input.neutralColor ?? currentNeutralColor.value,
    })

    if (user.value && !isAnonymous.value && !isImpersonating.value) {
      updatePreferences(input)
    }
  }

  return {
    applyPreferences,
    setAppearance,
    currentColorMode,
    currentPrimaryColor,
    currentNeutralColor,
  }
}
