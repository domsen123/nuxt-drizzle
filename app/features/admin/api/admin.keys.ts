export const adminKeys = {
  all: ['admin'] as const,
  organisations: () => [...adminKeys.all, 'organisations'] as const,
  organisation: (id: string) => [...adminKeys.all, 'organisation', id] as const,
}
