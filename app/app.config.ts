import { DEFAULT_NEUTRAL_COLOR, DEFAULT_PRIMARY_COLOR } from '~~/shared/user-preferences.constants'

export default defineAppConfig({
  ui: {
    colors: {
      primary: DEFAULT_PRIMARY_COLOR,
      neutral: DEFAULT_NEUTRAL_COLOR,
    },
    input: {
      slots: {
        root: 'w-full',
      },
    },
    textarea: {
      slots: {
        root: 'w-full',
      },
    },
    select: {
      slots: {
        base: 'w-full',
      },
    },
    selectMenu: {
      slots: {
        base: 'w-full',
      },
    },
  },
})
