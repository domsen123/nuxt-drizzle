export const adminKeys = {
  all: ['admin'] as const,
  organisations: () => [...adminKeys.all, 'organisations'] as const,
}
