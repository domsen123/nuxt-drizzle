import type { DropdownMenuItem } from '@nuxt/ui'
import type { ColorMode, NeutralColor } from '~~/shared/user-preferences.constants'
import { COLOR_MODES, NEUTRAL_COLORS, PRIMARY_COLORS } from '~~/shared/user-preferences.constants'
import { useAppearance } from './useAppearance'

const MODE_ICONS: Record<ColorMode, string> = {
  light: 'i-lucide-sun',
  dark: 'i-lucide-moon',
  system: 'i-lucide-monitor',
}

// Nuxt UI remaps --color-neutral-* to the selected neutral palette and
// exposes the original Tailwind palette as old-neutral for the chips.
const neutralChip = (color: NeutralColor) => color === 'neutral' ? 'old-neutral' : color

/**
 * Shared menu definitions for the Theme and Appearance submenus, modeled
 * after the Nuxt UI dashboard template UserMenu. Consuming dropdowns must
 * render `AppearanceColorChip` in their `#chip-leading` slot.
 */
export const useAppearanceMenuItem = () => {
  const { t } = useI18n()
  const { setAppearance, currentColorMode, currentPrimaryColor, currentNeutralColor } = useAppearance()

  const colorModeMenuItems = computed<DropdownMenuItem[]>(() =>
    COLOR_MODES.map(mode => ({
      label: t(`profile.appearance.${mode}`),
      icon: MODE_ICONS[mode],
      type: 'checkbox' as const,
      checked: currentColorMode.value === mode,
      onSelect: (e: Event) => {
        e.preventDefault()
        setAppearance({ colorMode: mode })
      },
    })),
  )

  const themeMenuItem = computed<DropdownMenuItem>(() => ({
    label: t('profile.appearance.theme'),
    icon: 'i-lucide-palette',
    children: [
      {
        label: t('profile.appearance.primary'),
        slot: 'chip' as const,
        chip: currentPrimaryColor.value,
        content: {
          align: 'center' as const,
          collisionPadding: 16,
        },
        children: PRIMARY_COLORS.map(color => ({
          label: color,
          chip: color,
          slot: 'chip' as const,
          type: 'checkbox' as const,
          checked: currentPrimaryColor.value === color,
          onSelect: (e: Event) => {
            e.preventDefault()
            setAppearance({ primaryColor: color })
          },
        })),
      },
      {
        label: t('profile.appearance.neutral'),
        slot: 'chip' as const,
        chip: neutralChip(currentNeutralColor.value),
        content: {
          align: 'end' as const,
          collisionPadding: 16,
        },
        children: NEUTRAL_COLORS.map(color => ({
          label: color,
          chip: neutralChip(color),
          slot: 'chip' as const,
          type: 'checkbox' as const,
          checked: currentNeutralColor.value === color,
          onSelect: (e: Event) => {
            e.preventDefault()
            setAppearance({ neutralColor: color })
          },
        })),
      },
    ],
  }))

  const appearanceMenuItem = computed<DropdownMenuItem>(() => ({
    label: t('profile.appearance.appearance'),
    icon: 'i-lucide-sun-moon',
    children: colorModeMenuItems.value,
  }))

  const appearanceMenuItems = computed<DropdownMenuItem[]>(() => [
    themeMenuItem.value,
    appearanceMenuItem.value,
  ])

  return {
    appearanceMenuItems,
    colorModeMenuItems,
  }
}
