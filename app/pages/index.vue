<script setup lang="ts">
const { t } = useI18n()
const installCmd = 'npx nuxi init -t gh:domsen123/nuxt-drizzle'
const { copy, copied } = useClipboard({ source: installCmd })

useSeoMeta({
  titleTemplate: '',
  title: () => t('common.landing.title'),
  ogTitle: () => t('common.landing.title'),
  description: () => t('common.landing.description'),
  ogDescription: () => t('common.landing.description'),
})

const features = [
  {
    num: '01',
    titleKey: 'common.landing.feature01Title',
    descKey: 'common.landing.feature01Desc',
    mock: [
      '● session active',
      '  user: hey@example.com',
      '  provider: Microsoft Entra ID',
      '  expires: 7d · httpOnly cookie',
      '',
      '○ anonymous session',
      '  converted on sign-up',
    ],
  },
  {
    num: '02',
    titleKey: 'common.landing.feature02Title',
    descKey: 'common.landing.feature02Desc',
    mock: [
      'acme-corp      owner    4 members',
      'big-startup    admin    2 members',
      'my-project     member   1 member',
      '',
      'Roles: owner · admin · member',
      'RBAC: resources × actions',
    ],
  },
  {
    num: '03',
    titleKey: 'common.landing.feature03Title',
    descKey: 'common.landing.feature03Desc',
    mock: [
      'PUT /api/files/upload',
      '  entityType: "user"',
      '  entityId:   "usr_123"',
      '',
      'avatar.jpg  → optimised · CDN',
      'report.pdf  → stored · linked',
    ],
  },
  {
    num: '04',
    titleKey: 'common.landing.feature04Title',
    descKey: 'common.landing.feature04Desc',
    mock: [
      'domsen123    global_admin  active',
      'jane.doe     member        active',
      'bob.smith    member        banned',
      '',
      '→ impersonate user',
      '→ assign roles',
      '→ manage organisations',
    ],
  },
  {
    num: '05',
    titleKey: 'common.landing.feature05Title',
    descKey: 'common.landing.feature05Desc',
    mock: [
      't(\'nav.settings\')',
      '→  "Settings"       (en)',
      '→  "Einstellungen"  (de)',
      '',
      'useLocaleFormat().formatDate(d)',
      '→  "Oct 15, 2026"   (en)',
      '→  "15.10.2026"     (de)',
    ],
  },
  {
    num: '06',
    titleKey: 'common.landing.feature06Title',
    descKey: 'common.landing.feature06Desc',
    mock: [
      'users.readMany({',
      '  filter: {',
      '    role: { _eq: \'admin\' },',
      '  },',
      '  sort: \'createdAt:desc\',',
      '  limit: 10,',
      '})',
    ],
  },
  {
    num: '07',
    titleKey: 'common.landing.feature07Title',
    descKey: 'common.landing.feature07Desc',
    mock: [
      'welcome.html.liquid      (en)',
      'welcome.de.html.liquid   (de)',
      '',
      'reset-password.html.liquid',
      'reset-password.de.html.liquid',
      '',
      '→ fallback to en if de missing',
    ],
  },
]

const stats = computed(() => [
  { value: t('common.landing.stat01Value'), label: t('common.landing.stat01Label') },
  { value: t('common.landing.stat02Value'), label: t('common.landing.stat02Label') },
  { value: t('common.landing.stat03Value'), label: t('common.landing.stat03Label') },
  { value: t('common.landing.stat04Value'), label: t('common.landing.stat04Label') },
])

const mockLineClass = (line: string) => {
  if (line.startsWith('●'))
    return 'text-green-400'
  if (line.startsWith('○'))
    return 'text-dimmed'
  if (line.startsWith('→'))
    return 'text-green-400/70'
  return 'text-muted'
}
</script>

<template>
  <div class="graph-paper">
    <div class="mx-auto w-full max-w-(--ui-container) border-x border-default bg-default">
      <section class="border-b border-default px-6 py-16 sm:px-10 sm:py-24">
        <p class="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          <span class="h-px w-8 bg-current" />
          The SaaS Starter
        </p>
        <h1 class="mt-6 text-[clamp(2.5rem,8vw,6rem)] font-extrabold tracking-[-0.055em] leading-[0.9] text-highlighted">
          {{ $t('common.landing.headlinePart1') }}<br>
          <span class="text-green-400">{{ $t('common.landing.headlineAccent') }}</span>
          {{ ' ' }}{{ $t('common.landing.headlinePart2') }}
        </h1>
        <p class="mt-6 max-w-xl text-muted leading-relaxed">
          {{ $t('common.landing.subheadline') }}
        </p>
        <div class="mt-8 flex w-full flex-col items-stretch ring ring-default font-mono text-sm sm:w-fit sm:flex-row">
          <code class="overflow-x-auto whitespace-nowrap px-4 py-3 text-highlighted">
            <span class="text-green-400 select-none">$ </span>{{ installCmd }}
          </code>
          <button
            class="shrink-0 border-t border-default px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted transition-colors hover:bg-elevated hover:text-highlighted sm:border-t-0 sm:border-l"
            @click="copy()"
          >
            {{ copied ? $t('common.landing.installCopied') : $t('common.landing.installCopy') }}
          </button>
        </div>
        <p class="mt-3 font-mono text-[11px] tracking-[0.15em] text-dimmed">
          {{ $t('common.landing.installMeta') }}
        </p>
        <div class="mt-8">
          <UButton :to="ROUTES.auth.signUp" size="lg" trailing-icon="i-lucide-arrow-right">
            {{ $t('common.actions.signUp') }}
          </UButton>
        </div>
      </section>

      <div class="grid grid-cols-2 gap-0 border-b border-default lg:grid-cols-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="p-6 ring ring-default transition-colors hover:bg-elevated"
        >
          <p class="text-4xl font-extrabold tracking-tight tabular-nums text-highlighted">
            {{ stat.value }}
          </p>
          <p class="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            {{ stat.label }}
          </p>
        </div>
      </div>

      <section class="border-b border-default">
        <div
          v-for="feature in features"
          :key="feature.num"
          class="grid grid-cols-1 border-b border-default last:border-b-0 lg:grid-cols-[5rem_1fr_22rem]"
        >
          <div class="flex items-start border-b border-default p-5 lg:border-b-0 lg:border-r">
            <span class="font-mono text-[11px] uppercase tracking-[0.2em] tabular-nums text-muted">{{ feature.num }}</span>
          </div>
          <div class="border-b border-default p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <h3 class="text-xl font-extrabold tracking-tight text-highlighted">
              {{ $t(feature.titleKey) }}
              <span class="text-muted">&thinsp;&rarr;</span>
            </h3>
            <p class="mt-3 max-w-sm text-sm leading-relaxed text-muted">
              {{ $t(feature.descKey) }}
            </p>
          </div>
          <div class="overflow-hidden bg-elevated p-5 font-mono text-xs leading-relaxed">
            <div class="mb-4 flex items-center gap-1.5 border-b border-default pb-3">
              <span class="size-1.5 rounded-full bg-accented" />
              <span class="size-1.5 rounded-full bg-accented" />
              <span class="size-1.5 rounded-full bg-accented" />
            </div>
            <div>
              <div
                v-for="(line, i) in feature.mock"
                :key="i"
                class="whitespace-pre"
                :class="mockLineClass(line)"
              >
                {{ line || ' ' }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="border-b border-default px-6 py-16 sm:px-10 sm:py-24">
        <h2 class="text-[clamp(2rem,6vw,5rem)] font-extrabold tracking-[-0.055em] leading-[0.9] text-highlighted">
          {{ $t('common.landing.ctaLine1') }}<br>
          {{ $t('common.landing.ctaLine2') }}
        </h2>
        <div class="mt-10 flex flex-wrap items-center gap-4">
          <UButton :to="ROUTES.auth.signUp" size="xl" trailing-icon="i-lucide-arrow-right">
            {{ $t('common.actions.signUp') }}
          </UButton>
          <UButton :to="ROUTES.auth.signIn" variant="ghost" color="neutral" size="xl">
            {{ $t('common.actions.signIn') }}
          </UButton>
        </div>
      </section>
    </div>
  </div>
</template>
