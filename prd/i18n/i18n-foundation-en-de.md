# PRD: i18n-Foundation — Englisch/Deutsch mit User-Locale-Preference

> Status: geplant · Scope: `@nuxtjs/i18n` (Strategie `no_prefix`, Default `en`, zweite Sprache `de`)
> für alle user-facing Flächen außer `/admin`. Sprachwahl als „Language"-Submenu mit Flaggen-Icons
> (`@iconify-json/flag`) in allen drei User-Menüs (`app/components/AppHeader.vue`,
> `app/layouts/dashboard.vue`, `app/layouts/admin.vue`); Persistenz pro Nutzer in
> `users.preferences.locale` über das bestehende `PUT /api/profile/preferences`. Gäste wählen per
> Cookie (Browser-Detection beim Erstbesuch). Zusätzlich: lokalisierte E-Mail-Templates,
> Fehler-Codes für API-Fehler, Legal-Seiten über `@nuxt/content`, lokalisierte Datums- und
> Zahlenformate.

## Context

Alle UI-Strings der App sind heute hartkodiert englisch; `app/app.vue` setzt `htmlAttrs.lang` statisch
auf `en`. Nutzer können die Sprache weder wählen noch mitnehmen. Dieses Feature führt `@nuxtjs/i18n`
ein und stellt alle user-facing Strings außerhalb von `/admin` auf Übersetzungs-Keys um.

Das Feature baut vollständig auf dem Appearance-Muster auf
(`prd/profile/appearance-preferences.md`), das bereits umgesetzt ist:

- `users.preferences` (jsonb, generisch angelegt) nimmt den neuen Key `locale` **ohne Migration** auf.
- `PUT /api/profile/preferences` (`server/api/profile/preferences.put.ts`) wird nur um ein
  Zod-Feld erweitert — keine neue Route, keine neue Service-Methode.
- `useAppearanceMenuItem` (`app/features/profile/composables/useAppearanceMenuItem.ts`) ist die
  Vorlage für das „Language"-Submenu; `useAppearance`/`useApplyPreferences` die Vorlage für
  Anwenden + Persistieren; der `watch` in `app/app.vue` wendet DB-Preferences bereits beim
  SSR-Render an.
- Die Gäste-Behandlung folgt dem bestehenden Gäste-Modus-Dropdown im `AppHeader`
  (`app/components/AppHeader.vue:142`).

**Was es bewusst *nicht* ist:** keine URL-Lokalisierung (`/de/...`), kein hreflang/SEO-Ausbau,
keine Übersetzung der Admin-Flächen, keine dritte Sprache, keine Übersetzungs-Workflows
(Crowdin o. Ä.).

## Produktentscheidungen (final)

| Thema | Entscheidung |
|---|---|
| Modul | `@nuxtjs/i18n` (aktuelle Major-Version für Nuxt 4), Eintrag im pnpm-Catalog (`pnpm-workspace.yaml`) wie alle anderen Dependencies |
| Sprachen | `en` (Default/Fallback) und `de`; Locale-Codes `en`/`de`, `language`-Attribute `en-US`/`de-DE` |
| URL-Strategie | `strategy: 'no_prefix'` — URLs bleiben unverändert, `app/utils/routes.ts` und alle Links bleiben unangetastet |
| Ablage | Eine Datei pro Sprache: `i18n/locales/en.json` + `i18n/locales/de.json`, gegliedert in Namespaces pro Feature (`common`, `nav`, `auth`, `dashboard`, `settings`, `profile`, `organisations`, `files`, `legal`, `errors`) |
| Einstiegspunkt | „Language"-Submenu (Muster: `useAppearanceMenuItem`) in **allen drei** User-Menüs: `AppHeader`, dashboard-Layout, admin-Layout — eingehängt direkt nach dem „Appearance"-Item |
| Flaggen | `@iconify-json/flag` (installiert). Englisch = `i-flag-us-4x3`, Deutsch = `i-flag-de-4x3`. Submenu-Items zeigen Flagge + Endonym („English", „Deutsch", nie übersetzt) |
| Persistenz | `users.preferences.locale` (jsonb-Key, **keine Migration**); Schreiben über bestehende Mutation `useUpdatePreferences` → `PUT /api/profile/preferences` |
| Quelle der Wahrheit | Für eingeloggte, nicht-anonyme Nutzer gewinnt die DB: gespeicherte `locale` überschreibt den Cookie beim Laden (SSR + Client). Ohne gespeicherte `locale` bleibt die Cookie-/Detection-Sprache aktiv |
| Gäste / anonyme Nutzer | Eigenes Flaggen-Dropdown im `AppHeader` neben dem Gäste-Modus-Dropdown. Persistenz per i18n-Cookie (`cookieKey: 'locale'`), keine DB-Schreibung. Erstbesuch: `detectBrowserLanguage` — Browser `de*` → Deutsch, sonst Englisch |
| Impersonation | Sprachwechsel wirkt nur lokal, keine DB-Schreibung (`isImpersonating` aus `useSession()` unterdrückt die Mutation — identisch zu `setAppearance`) |
| Admin-Bereich | Admin-Layout, Admin-Pages (`app/pages/admin/**`) und admin-Feature-Components bleiben hartkodiert englisch — kein `$t` dort. Das geteilte User-Menü (inkl. Language-Submenu) folgt der aktiven Sprache und ist auch im Admin sichtbar |
| API-Fehler | Endpoints liefern stabile Fehler-Codes in `data.code` (z. B. `auth.invalid_credentials`); `statusText` bleibt englisch. Der Client mappt `data.code` auf den i18n-Key `errors.<code>`, Fallback ist `statusText`. Gilt für alle non-admin Endpoints; Admin-Endpoints bleiben unverändert |
| E-Mails | Ein Template pro Sprache: bestehende Dateien in `server/assets/templates/` bleiben die `en`-Variante, deutsche Varianten heißen `<name>.de.html.liquid` / `<name>.de.txt.liquid`. Loader wählt nach Empfänger-Locale mit Fallback auf die en-Datei |
| Empfänger-Locale | `user.preferences.locale ?? 'en'`. Bei Organisations-Einladungen: existiert ein User mit der Ziel-E-Mail, gilt dessen Locale, sonst `en` |
| Legal-Seiten | `@nuxt/content` aktivieren (Modul ist in `nuxt.config.ts` auskommentiert und in `package.json` vorhanden). Inhalte als Markdown: `content/legal/<locale>/terms-of-service.md` und `.../privacy-policy.md`; Pages rendern per `queryCollection` nach aktiver Locale, Fallback `en` |
| Formate | Datums- und Zahlenformate folgen der aktiven Locale außerhalb `/admin`: date-fns mit Locale-Map (`enUS`/`de`), Zahlen über `Intl.NumberFormat`. Admin behält die heutigen Formate |
| Verortung | Sprachwahl-Logik im bestehenden **profile-Slice** (wie Appearance). Cross-cutting-Helfer (`useApiErrorMessage`, `useLocaleFormat`) in `app/composables/`. Konstanten in `shared/user-preferences.constants.ts` |
| Design-Grundlage | Kein Pencil-Screen (Repo ohne `.pen`-Datei). Das bestehende User-Menü-Muster (`useAppearanceMenuItem` + Nuxt-UI-`UDropdownMenu`) ist die verbindliche Design-Vorlage |

## Scope

**In Scope**

- `@nuxtjs/i18n` installieren und konfigurieren (`no_prefix`, `en`/`de`, Cookie + Browser-Detection).
- `i18n/locales/en.json` + `de.json` mit allen Strings der non-admin Client-UI: Landing
  (`app/pages/index.vue`), Auth-Pages (`app/pages/auth/**`), Dashboard (`app/pages/dashboard/**`),
  Settings (`app/pages/settings/**`), `401.vue`, Layouts `default`/`auth`/`dashboard`, geteilte
  Components (`AppHeader`, `AppFooter`, `AppPageHeader`, `EmailVerificationBanner`, …) und die
  Components/Composables der non-admin Feature-Slices (auth, profile, organisations,
  organisation-members, organisation-invitations, files) inkl. Toasts und Client-Validierungstexten.
- `locale` als neuer Key in `UserPreferences` + Zod-Erweiterung in
  `server/api/profile/preferences.put.ts`.
- „Language"-Submenu in allen drei User-Menüs; Gäste-Flaggen-Dropdown im `AppHeader`.
- Anwenden der DB-Locale beim Laden über den bestehenden `watch` in `app/app.vue`;
  `htmlAttrs.lang` folgt der aktiven Locale.
- Fehler-Code-Konvention (`data.code`) in den non-admin Endpoints + Client-Mapping
  `useApiErrorMessage`.
- Deutsche E-Mail-Template-Varianten (4 Templates × html/txt) + Locale-aware Loader.
- Legal-Seiten über `@nuxt/content` (en + de).
- Lokalisierte Datums-/Zahlenformate über `useLocaleFormat` (betrifft u. a.
  `app/features/auth/components/SessionsList.vue`, `app/features/profile/components/ProfileForm.vue`).

**Out of Scope**

- Übersetzung von Admin-Layout, Admin-Pages und admin-Feature-Components (bleiben englisch).
- URL-Präfixe, `localePath`, hreflang-/SEO-Alternates, Sitemap-Lokalisierung.
- Weitere Sprachen über `en`/`de` hinaus; Sprach-Verwaltung durch Admins.
- Übersetzung von Log-Ausgaben, Seed-Daten und Admin-API-Fehlern.
- Übersetzungs-Management-Tooling (Crowdin, Lokalise, …).

## Pencil-Screens

Kein Pencil-Screen vorhanden (Repo enthält keine `.pen`-Datei; OpenPencil war zum
Erstellungszeitpunkt nicht verbunden). Finale Entscheidung: Die UI entsteht ohne Pencil-Design
direkt mit Nuxt-UI-Komponenten. Verbindliche Design-Vorlage ist das bestehende User-Menü-Muster aus
dem Appearance-Feature: Submenu mit Checkbox-Items (`type: 'checkbox'`, `onSelect` mit
`e.preventDefault()`), Aufbau wie `useAppearanceMenuItem`
(`app/features/profile/composables/useAppearanceMenuItem.ts`). Das „Language"-Submenu trägt das
Icon `i-lucide-languages`; seine zwei Kind-Items zeigen Flagge (`i-flag-us-4x3` / `i-flag-de-4x3`)
und Endonym.

## Frontend-Umsetzung (Handoff)

Abweichend vom Standard-Handoff startet **kein** `pencil-nuxt-implementer`, weil kein Pencil-Design
existiert. Der PRD-Implementierungs-Agent baut die UI **erst nach** der Backend-Umsetzung
(Schema-Typen, API-Erweiterung, E-Mail-Loader, Fehler-Codes aus `## Umsetzung`) direkt mit
Nuxt-UI-Komponenten. Vorlage ist das User-Menü-Muster aus `## Pencil-Screens`; Zielflächen sind die
Components und Menüs aus `## Umsetzung`, Schritte 9 und 11.

## Datenmodell

**Keine neue Tabelle, keine Migration.** `users.preferences` ist jsonb (NOT NULL, Default `{}`);
der neue Key `locale` ist eine reine Typ-Erweiterung in `shared/user-preferences.constants.ts`:

```typescript
export const LOCALES = ['en', 'de'] as const
export type Locale = typeof LOCALES[number]
export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
}

export interface UserPreferences {
  colorMode?: ColorMode
  primaryColor?: PrimaryColor
  neutralColor?: NeutralColor
  locale?: Locale
}
```

Die Flaggen-Icons sind Client-Belang und leben im Menü-Composable (Schritt 8), nicht in `shared/`.
Kein Index, keine `relations()`-Änderung, `pnpm db:generate` erzeugt keine Migration.

## Umsetzung (Feature-Anatomie)

Gemappt auf die 11-Schritt-Checkliste aus `_ARCHITECTURE.md`. Das Feature erweitert den
bestehenden profile-Slice; zusätzlich gibt es ein Modul-Setup vor Schritt 1.

**Vorbereitung (vor Schritt 1) — Modul-Setup**

- Dependencies: `@nuxtjs/i18n` in `pnpm-workspace.yaml` (Catalog) + `package.json` aufnehmen;
  `@iconify-json/flag` ist bereits installiert. `@nuxt/content` ist in `package.json` vorhanden —
  Modul-Eintrag in `nuxt.config.ts` einkommentieren.
- `nuxt.config.ts`:

  ```typescript
  modules: [
    // … bestehende Module
    '@nuxt/content',
    '@nuxtjs/i18n',
  ],
  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'locale',
      fallbackLocale: 'en',
    },
  },
  ```

  Die exakten Options-Namen prüft der Implementierer gegen die Doku der installierten
  i18n-Major-Version; die Entscheidungen (Strategie, Cookie-Key, Detection, Dateien) sind final.
- `i18n/locales/en.json` und `i18n/locales/de.json` anlegen (Namespaces siehe Entscheidungstabelle).
- `content.config.ts` (Root) mit einer `legal`-Collection (`type: 'page'`, `source: 'legal/**'`)
  und Markdown-Inhalten unter `content/legal/en/` + `content/legal/de/`.

1. **Schema** — keine DB-Änderung. `shared/user-preferences.constants.ts` um `LOCALES`, `Locale`,
   `DEFAULT_LOCALE`, `LOCALE_NAMES` und `UserPreferences.locale` erweitern (siehe Datenmodell).
2. **ItemService** — keiner neu; `getUsersItemService()` ist in `server/utils/container.ts`
   vorhanden und im `profileService` injiziert.
3. **Feature-Service** —
   - `server/features/profile/profile.service.ts`: keine Änderung — `updatePreferences` merged
     generisch und nimmt `locale` automatisch mit.
   - `server/features/email/templates/index.ts`: alle vier Template-Funktionen
     (`passwordResetTemplate`, `emailVerificationTemplate`, `emailChangeTemplate`,
     `organisationInvitationTemplate`) erhalten einen Parameter `locale: Locale`. Der Loader
     versucht `templates/<name>.<locale>.html.liquid` / `.txt.liquid` und fällt für `en` oder bei
     fehlender Datei auf die bestehenden `templates/<name>.html.liquid`-Dateien zurück.
   - Aufrufer der Templates (Auth-, Profile-, Invitation-Flows) übergeben die Empfänger-Locale:
     `user.preferences.locale ?? DEFAULT_LOCALE`; bei Einladungen die Locale des existierenden
     Users mit der Ziel-E-Mail, sonst `DEFAULT_LOCALE`.
   - Deutsche Template-Dateien anlegen: `server/assets/templates/<name>.de.html.liquid` +
     `<name>.de.txt.liquid` für alle vier Mails.
4. **Wire Service** — keine Änderung; `profileService` und `emailService` sind in
   `server/utils/container.ts` verdrahtet.
5. **API-Routen** —
   - `server/api/profile/preferences.put.ts`: Zod-Schema um
     `locale: z.enum(LOCALES).optional()` erweitern; sonst unverändert.
   - Fehler-Code-Konvention für alle non-admin Endpoints (auth, profile, organisations,
     organisation-members, organisation-invitations, files): user-facing `createError`-Aufrufe
     erhalten zusätzlich `data: { code: '<namespace>.<fehler>' }` (z. B.
     `auth.invalid_credentials`, `profile.email_taken`, `invitations.expired`). `statusText`
     bleibt englisch und unverändert; bestehende Status-Codes bleiben gleich. Die Codes landen
     als Keys unter `errors.*` in beiden Locale-Dateien.
6. **Client-API** — keine neue Methode; `profileApi.updatePreferences`
   (`app/features/profile/api/profile.api.ts`) transportiert `locale` über den bestehenden
   `UserPreferences`-Typ.
7. **Query-Keys** — keine neuen Keys; die bestehende Invalidierung von `profileKeys.profile()` und
   `authKeys.session()` in `useUpdatePreferences` deckt `locale` ab.
8. **Composables** —
   - `app/features/profile/composables/useLanguage.ts`: Muster `useAppearance`. Liefert
     `currentLocale` (aus `useI18n()`), `setLanguage(locale)` — ruft `setLocale(locale)` (wirkt
     sofort, schreibt den i18n-Cookie) und feuert nur für eingeloggte, nicht-anonyme Nutzer ohne
     aktive Impersonation `updatePreferences({ locale })`.
   - `app/features/profile/composables/useApplyPreferences.ts` erweitern: wendet
     `prefs.locale` über `setLocale` an, wenn gesetzt und verschieden von der aktiven Locale
     (DB gewinnt beim Laden).
   - `app/features/profile/composables/useLanguageMenuItem.ts`: Muster `useAppearanceMenuItem`.
     Liefert `languageMenuItem` (Label aus `$t('common.language')`, Icon `i-lucide-languages`,
     Kinder: je Locale ein Checkbox-Item mit `icon: 'i-flag-us-4x3' | 'i-flag-de-4x3'`, Label aus
     `LOCALE_NAMES`, `checked` gegen `currentLocale`, `onSelect` mit `e.preventDefault()` →
     `setLanguage(locale)`) sowie `guestLanguageMenuItems` (dieselben zwei Items für das
     Gäste-Dropdown).
   - `app/composables/useApiErrorMessage.ts` (cross-cutting): mappt einen `$fetch`-Fehler auf
     einen übersetzten String — `error.data?.code` → `t('errors.' + code)` wenn der Key existiert
     (`te()`), sonst `statusText`-Fallback. Alle non-admin Toasts/Fehleranzeigen nutzen diesen
     Helper.
   - `app/composables/useLocaleFormat.ts` (cross-cutting): liefert `formatDate`
     (date-fns `format` mit Locale-Map `{ en: enUS, de: de }` aus `date-fns/locale`) und
     `formatNumber` (`Intl.NumberFormat` der aktiven Locale). Non-admin Stellen mit
     Datums-/Zahlenausgabe stellen darauf um.
9. **Components** —
   - „Language"-Submenu in die drei User-Menüs einhängen: `app/components/AppHeader.vue`
     (`userMenuItems`), `app/layouts/dashboard.vue`, `app/layouts/admin.vue` — jeweils direkt
     nach dem „Appearance"-Item der bestehenden Appearance-Gruppe.
   - Gäste: im `AppHeader` neben dem Gäste-Modus-Dropdown ein zweites `UDropdownMenu` mit
     Icon-Button (Flagge der aktiven Locale) und `guestLanguageMenuItems` — ohne DB-Schreibung.
   - Alle non-admin Components auf `$t`-Keys umstellen (Strings, `aria-label`s, Platzhalter,
     Toast-Texte, Zod-Client-Fehlermeldungen).
   - Legal-Pages: `app/pages/terms-of-service.vue` und `app/pages/privacy-policy.vue` laden per
     `queryCollection('legal')` den Eintrag `/legal/<locale>/<slug>`, Fallback
     `/legal/en/<slug>`, Rendern über `<ContentRenderer>`.
10. **Barrel-Export** — `app/features/profile/index.ts`: `useLanguage` und `useLanguageMenuItem`
    ergänzen; Re-Export von `Locale`/`LOCALES` aus den Shared-Konstanten.
11. **Pages / Routen** — keine neuen Pages, keine neuen Routen-Konstanten. In `app/app.vue`:
    `htmlAttrs.lang` von statisch `'en'` auf die aktive Locale umstellen; der bestehende
    `watch` auf `useSession().user` wendet über das erweiterte `applyPreferences` auch die
    DB-Locale an. Alle non-admin Pages auf `$t` umstellen; `app/pages/admin/**` bleibt unberührt.

## Technische Hinweise

- **SSR ohne Sprach-Blitz:** `detectBrowserLanguage.useCookie` lässt den Server die Locale aus dem
  Cookie lesen — das SSR-HTML rendert bereits in der richtigen Sprache. Die DB-Locale wendet der
  `app.vue`-Watch an (Session-Cache ist durch `app/plugins/api.ts` beim SSR-Render gefüllt);
  Cookie und DB laufen damit nach dem ersten Render synchron.
- **DB gewinnt, Cookie folgt:** `setLocale` aus `useI18n()` aktualisiert den Cookie bei jedem
  Wechsel. Meldet sich ein Nutzer mit gespeicherter `locale` an einem Gerät mit anderem Cookie an,
  setzt `applyPreferences` die DB-Locale durch — identisch zur Appearance-Semantik.
- **Gäste → Login-Übergang:** Wählt ein Gast Deutsch und registriert sich, bleibt Deutsch aktiv
  (Cookie); erst eine explizite Wahl im User-Menü schreibt in die DB. Ein leeres
  `preferences.locale` überschreibt die Cookie-Sprache nicht.
- **Fehler-Codes statt Fehlertexte:** Server bleibt übersetzungsfrei. `data.code` ist
  API-Vertrag; Codes sind `snake_case` mit Feature-Namespace. Client-Mapping ausschließlich über
  `useApiErrorMessage` — kein Component parst `statusText`.
- **E-Mail-Fallback:** Der Template-Loader wirft weiterhin, wenn **auch** die en-Basisdatei fehlt;
  eine fehlende de-Variante ist kein Fehler, sondern Fallback auf en.
- **Namespaces:** Keys folgen `<namespace>.<bereich>.<key>` (z. B. `auth.signIn.title`,
  `common.actions.save`, `errors.auth.invalid_credentials`). Beide Locale-Dateien halten
  identische Key-Mengen; `en.json` ist die Referenz.
- **Pinia Colada / Cache-Invalidierung:** Die bestehende Mutation `useUpdatePreferences`
  invalidiert `profileKeys.profile()` und `authKeys.session()` — `locale` reist in beiden
  Antworten mit. Keine neuen Queries, keine Listen betroffen.
- **Zod v4:** `z.enum(LOCALES)` aus den Shared-Konstanten; `.trim()` entfällt, weil keine freien
  Strings akzeptiert werden. `z.strictObject` weist unbekannte Keys weiter zurück.
- **Guards:** `requireAuth` reicht (bestehender Endpoint); Gäste schreiben nie in die DB.
- **Menü-Verhalten:** Checkbox-Items brauchen `e.preventDefault()` in `onSelect`, damit das
  Dropdown beim Umschalten offen bleibt (wie Theme/Appearance).
- **Admin-Grenze:** `/admin`-Flächen verwenden kein `$t`. Das geteilte User-Menü ist übersetzt und
  folgt der aktiven Sprache auch im Admin — das ist gewollt und kein Fehler.

**Anti-Patterns vermeiden** (`_ARCHITECTURE.md`):

- Keine Business-Logik in API-Routen — Locale-Merge läuft im `profileService`, Template-Wahl im
  email-Feature.
- Keine direkten DB-Queries in Routen — nur über Services/ItemService.
- Keine API-Calls aus Components — Menü-Items rufen `useLanguage`, das die bestehende Mutation nutzt.
- Keine Cross-Feature-Imports am `index.ts` vorbei — Layouts/Header importieren aus
  `~/features/profile`.
- Keine hartkodierten Query-Keys — bestehende `profileKeys`/`authKeys`-Factories.
- Keine fehlende Cache-Invalidierung nach der Mutation (Session **und** Profile).
- i18n-spezifisch: keine String-Konkatenation für übersetzte Sätze (Interpolation mit
  `{placeholder}` verwenden); keine übersetzten Strings in `shared/` oder im Server-Code; keine
  `$t`-Aufrufe in `app/pages/admin/**` und admin-Feature-Components.

## Erfolgskriterien

- Ein eingeloggter, nicht-anonymer Nutzer wählt im User-Menü (Header, dashboard- und admin-Layout)
  unter „Language" zwischen „English" (`i-flag-us-4x3`) und „Deutsch" (`i-flag-de-4x3`); die UI
  wechselt sofort, `PUT /api/profile/preferences` schreibt `{ locale }` in `users.preferences`.
- Nach Reload und auf einem zweiten Gerät (gleicher Account) rendert die App die DB-Sprache —
  bereits im SSR-HTML, `<html lang>` trägt die aktive Locale.
- Ein Gast mit Browser-Sprache `de-DE` sieht die App beim Erstbesuch auf Deutsch; seine Wahl im
  Gäste-Dropdown persistiert im Cookie und löst keinen Request auf `/api/profile/preferences` aus.
- Während einer Impersonation wechselt die Sprache nur lokal; `users.preferences` des
  impersonierten Nutzers bleibt unverändert.
- Alle Flächen außerhalb `/admin` (Landing, Auth, Dashboard, Settings, 401, Legal, Toasts,
  Formular-Validierung) sind auf Deutsch vollständig übersetzt; `/admin` bleibt durchgehend
  englisch (bis auf das geteilte User-Menü).
- `locale: 'fr'` beantwortet `PUT /api/profile/preferences` mit 400; ohne Session kommt 401.
- Ein non-admin API-Fehler (z. B. falsches Passwort beim Login) erscheint bei aktiver deutscher
  Sprache als deutscher Text (Mapping über `data.code`); der `statusText` der Antwort bleibt
  englisch.
- Passwort-Reset-, Verifizierungs-, E-Mail-Wechsel- und Einladungs-Mails kommen für Nutzer mit
  `locale: 'de'` auf Deutsch an (html + txt); ohne gespeicherte Locale auf Englisch.
- `terms-of-service` und `privacy-policy` rendern deutschen Markdown-Inhalt bei aktiver deutscher
  Sprache, englischen sonst.
- Datums- und Zahlenausgaben außerhalb `/admin` (u. a. `SessionsList`, `ProfileForm`) folgen der
  aktiven Locale.
- `pnpm lint` und `pnpm typecheck` sind grün; `pnpm db:generate` erzeugt keine neue Migration.
