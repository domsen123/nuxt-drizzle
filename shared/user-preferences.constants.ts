export const COLOR_MODES = ['light', 'dark', 'system'] as const
export const PRIMARY_COLORS = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'] as const
export const NEUTRAL_COLORS = ['slate', 'gray', 'zinc', 'neutral', 'stone'] as const

export type ColorMode = typeof COLOR_MODES[number]
export type PrimaryColor = typeof PRIMARY_COLORS[number]
export type NeutralColor = typeof NEUTRAL_COLORS[number]

export const DEFAULT_COLOR_MODE: ColorMode = 'system'
export const DEFAULT_PRIMARY_COLOR: PrimaryColor = 'fuchsia'
export const DEFAULT_NEUTRAL_COLOR: NeutralColor = 'slate'

export interface UserPreferences {
  colorMode?: ColorMode
  primaryColor?: PrimaryColor
  neutralColor?: NeutralColor
}
