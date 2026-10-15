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
</script>

<template>
  <div class="bg-[#0d0d0d] text-white">
    <!-- Hero -->
    <section class="px-6 lg:px-12 pt-24 pb-20 max-w-7xl mx-auto">
      <p class="font-mono text-xs text-[#555] uppercase tracking-[0.2em] mb-6">
        — The SaaS Starter
      </p>

      <h1 class="text-[clamp(3rem,10vw,8rem)] font-black leading-none tracking-tight mb-8">
        {{ $t('common.landing.headlinePart1') }}<br>
        <span class="text-[#00DC82]">{{ $t('common.landing.headlineAccent') }}</span>
        {{ ' ' }}{{ $t('common.landing.headlinePart2') }}
      </h1>

      <p class="text-[#888] text-lg max-w-xl leading-relaxed mb-10">
        {{ $t('common.landing.subheadline') }}
      </p>

      <!-- Install command -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
        <div class="flex items-center gap-3 bg-[#141414] border border-[#2a2a2a] rounded-lg px-4 py-3 font-mono text-sm">
          <span class="text-[#555] select-none">$</span>
          <span class="text-[#e5e5e5]">{{ installCmd }}</span>
          <button
            class="ml-2 text-xs text-[#555] hover:text-white transition-colors border border-[#333] hover:border-[#555] rounded px-2 py-0.5"
            @click="copy()"
          >
            {{ copied ? $t('common.landing.installCopied') : $t('common.landing.installCopy') }}
          </button>
        </div>

        <UButton
          :to="ROUTES.auth.signUp"
          size="lg"
          trailing-icon="i-lucide-arrow-right"
          class="shrink-0"
        >
          {{ $t('common.actions.signUp') }}
        </UButton>
      </div>

      <p class="font-mono text-xs text-[#444]">
        {{ $t('common.landing.installMeta') }}
      </p>
    </section>

    <!-- Stats -->
    <section class="border-y border-[#1a1a1a] py-12">
      <div class="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
        <div v-for="stat in stats" :key="stat.label">
          <div class="text-4xl font-black mb-1">
            {{ stat.value }}
          </div>
          <div class="text-sm text-[#555] font-mono">
            {{ stat.label }}
          </div>
        </div>
      </div>
    </section>

    <!-- Numbered features -->
    <section>
      <div
        v-for="feature in features"
        :key="feature.num"
        class="border-b border-[#1a1a1a]"
      >
        <div class="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-[120px_1fr_360px] gap-6 lg:gap-12 items-start">
          <!-- Number -->
          <div class="font-black text-[#1c1c1c] text-8xl leading-none select-none hidden lg:block">
            {{ feature.num }}
          </div>
          <div class="font-mono text-xs text-[#444] lg:hidden mb-2">
            {{ feature.num }}
          </div>

          <!-- Text -->
          <div>
            <h3 class="text-2xl font-bold mb-3">
              {{ $t(feature.titleKey) }}
              <span class="text-[#333]">&nbsp;&rarr;</span>
            </h3>
            <p class="text-[#666] leading-relaxed max-w-sm">
              {{ $t(feature.descKey) }}
            </p>
          </div>

          <!-- Mock -->
          <div class="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 font-mono text-xs leading-relaxed overflow-hidden">
            <div class="flex items-center gap-1.5 mb-4">
              <span class="w-2.5 h-2.5 rounded-full bg-[#2a2a2a]" />
              <span class="w-2.5 h-2.5 rounded-full bg-[#2a2a2a]" />
              <span class="w-2.5 h-2.5 rounded-full bg-[#2a2a2a]" />
            </div>
            <div class="space-y-0.5">
              <div
                v-for="(line, i) in feature.mock"
                :key="i"
                class="whitespace-pre"
                :class="line.startsWith('●') ? 'text-[#00DC82]' : line.startsWith('○') ? 'text-[#555]' : line.startsWith('→') ? 'text-[#00DC82]/70' : 'text-[#555]'"
              >
                {{ line || ' ' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Bottom CTA -->
    <section class="px-6 lg:px-12 pt-32 pb-40 max-w-7xl mx-auto">
      <h2 class="text-[clamp(3rem,8vw,6rem)] font-black leading-none tracking-tight mb-10">
        {{ $t('common.landing.ctaLine1') }}<br>
        {{ $t('common.landing.ctaLine2') }}
      </h2>
      <div class="flex items-center gap-4 flex-wrap">
        <UButton
          :to="ROUTES.auth.signUp"
          size="xl"
          trailing-icon="i-lucide-arrow-right"
        >
          {{ $t('common.actions.signUp') }}
        </UButton>
        <UButton
          :to="ROUTES.auth.signIn"
          variant="ghost"
          color="neutral"
          size="xl"
        >
          {{ $t('common.actions.signIn') }}
        </UButton>
      </div>
    </section>
  </div>
</template>
