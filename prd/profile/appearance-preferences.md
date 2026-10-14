# PRD: Erscheinungsbild-Einstellungen im User-Menü (Color Mode + Primary/Neutral Color, DB-persistiert)

> Status: umgesetzt (2026-10-14) · Scope: „Theme"- und „Appearance"-Submenus in allen drei User-Menüs
> (`app/components/AppHeader.vue`, `app/layouts/dashboard.vue`, `app/layouts/admin.vue`) mit Modus-Wahl
> (Light/Dark/System), Primary-Farbwahl (17 Tailwind-Farben) und Neutral-Farbwahl (5 Farben) — Aufbau
> wie im Template-UserMenu, User-facing Strings auf Englisch. Persistenz pro Nutzer im neuen jsonb-Feld
> `users.preferences` über `PUT /api/profile/preferences`. Gäste erhalten im Header nur einen lokalen
> Modus-Umschalter.

## Context

Die App hat heute drei inline gebaute User-Dropdowns (`userMenuItems` in `app/components/AppHeader.vue:48`,
`app/layouts/dashboard.vue:37`, `app/layouts/admin.vue:113`) und einen `UColorModeButton` im Header
(`app/components/AppHeader.vue:107`). Die Primary-Farbe ist statisch in `app/app.config.ts` auf
`fuchsia` gesetzt. Nutzer können den Dark-Mode nur lokal umschalten; die Wahl folgt ihnen nicht auf
andere Geräte, und die Primary-Farbe ist gar nicht wählbar.

Dieses Feature übernimmt das Muster aus dem [UserMenu des Nuxt-UI-Dashboard-Templates](https://github.com/nuxt-ui-templates/dashboard/blob/main/app/components/UserMenu.vue):
die „Theme"- und „Appearance"-Submenus im User-Dropdown mit Checkbox-Items für den Modus und
Chip-Items für die Primary- und Neutral-Farbe. Ergänzend zum Template speichert die App die Werte serverseitig im neuen
jsonb-Feld `users.preferences`, sodass die Wahl geräteübergreifend gilt. Die Umsetzung erweitert den
vorhandenen **profile-Slice** (`app/features/profile/`, `server/features/profile/profile.service.ts`,
`server/api/profile/`) — kein neuer Slice, kein neuer Service.

**Was es bewusst *nicht* ist:** keine Einstellungs-Seite unter `/settings` (Menü-only), keine
weiteren Preferences (Sprache, Dichte, …) — das Feld `preferences` ist aber bewusst generisch
angelegt, damit spätere Keys ohne Migration dazukommen.

## Produktentscheidungen (final)

| Thema | Entscheidung |
|---|---|
| Einstiegspunkt | „Theme"- und „Appearance"-Submenus (wie im Template-UserMenu) in **allen drei** User-Menüs (AppHeader, dashboard-Layout, admin-Layout) über eine gemeinsame, wiederverwendbare Menü-Definition im profile-Slice. User-facing Strings auf Englisch |
| Modus-Wahl | „Appearance"-Submenu mit drei Checkbox-Items **Light / Dark / System** (`colorMode.preference = 'light' \| 'dark' \| 'system'`) |
| Farbwahl | „Theme"-Submenu mit **Primary** (17 Farben: `red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose`) und **Neutral** (5 Farben: `slate, gray, zinc, neutral, stone`) |
| UI-Muster | Wie im Template: Submenu-Items mit `type: 'checkbox'`, Farb-Items mit `slot: 'chip'` + `chip: <farbe>` und `#chip-leading`-Slot-Template; Farbwechsel über `appConfig.ui.colors.primary` bzw. `appConfig.ui.colors.neutral` (Chip für `neutral` nutzt den Nuxt-UI-Alias `old-neutral`) |
| Persistenz | Neues Feld `users.preferences` (jsonb, NOT NULL, Default `{}`) mit Shape `{ colorMode?, primaryColor?, neutralColor? }`; Update über `PUT /api/profile/preferences` (requireAuth, Zod v4) |
| Merge-Semantik | `updatePreferences` merged flach in die bestehenden Preferences; unbekannte, künftige Keys bleiben erhalten |
| Quelle der Wahrheit | Für eingeloggte, nicht-anonyme Nutzer gewinnt die DB: Beim Laden (SSR + Client) wendet die App `preferences` auf `colorMode.preference` und `appConfig.ui.colors.primary` an |
| Schreibverhalten | Optimistisch: Auswahl wirkt sofort lokal, Mutation läuft parallel; bei Fehler Toast und Rückfall auf den letzten Serverstand |
| Gäste / anonyme Nutzer | Sehen die Theme/Appearance-Menüs **nicht**. Im AppHeader erscheint für sie anstelle des bisherigen `UColorModeButton` ein Dropdown mit **nur** den drei Modus-Items (Light/Dark/System), ohne Farbwahl und ohne DB-Schreibung (lokale Persistenz über das color-mode-Modul) |
| `UColorModeButton` | Wird aus `AppHeader.vue` entfernt. Eingeloggte Nutzer nutzen die Theme/Appearance-Menüs, Gäste das Modus-Dropdown |
| Impersonation | Menüpunkt bleibt sichtbar; Änderungen wirken nur lokal, es erfolgt **keine** DB-Schreibung (`isImpersonating` aus `useSession()` unterdrückt die Mutation) |
| Defaults | Leeres `preferences` → App-Defaults: Modus `system`, Primary `fuchsia`, Neutral `slate` (wie `app/app.config.ts`) |
| Typ-/Konstanten-Ort | `shared/user-preferences.constants.ts`: `COLOR_MODES`, `PRIMARY_COLORS`, `NEUTRAL_COLORS`, `DEFAULT_*`-Defaults, Typ `UserPreferences` — eine Quelle für Client-Menü, `app.config.ts` und Server-Validierung |
| Design-Grundlage | Kein Pencil-Screen. Das Template-UserMenu (Link im Context) ist die verbindliche Design-Vorlage; die UI entsteht direkt mit Nuxt-UI-Komponenten |

## Scope

**In Scope**

- Spalte `preferences` (jsonb) auf `users` (+ Migration via `pnpm db:generate` → `pnpm db:migrate`).
- Shared-Konstanten und Typ in `shared/user-preferences.constants.ts`.
- `profileService.updatePreferences(userId, input)` + Endpoint `server/api/profile/preferences.put.ts`.
- Client: API-Methode, Mutation, Anwende-Composable und Menü-Definition im profile-Slice.
- Integration der Theme/Appearance-Items in die drei User-Menüs; Gäste-Modus-Dropdown im AppHeader; `UColorModeButton` entfernen.
- Erweiterung der bestehenden Typen `AuthUser` (`app/features/auth/types/auth.types.ts`) und
  `UserProfile` (Client + `server/features/profile/profile.service.ts`) um `preferences`.

**Out of Scope**

- Erscheinungsbild-Sektion auf der `/settings`-Seite (Menü ist die einzige Fläche).
- Weitere Preference-Keys (Sprache, Schriftgröße, …).
- Admin-Verwaltung fremder Preferences; Preferences für anonyme User-Zeilen.
- Radius-/Theme-Anpassungen über Modus und Primary hinaus.

## Pencil-Screens

Kein Pencil-Screen vorhanden (Repo enthält keine `.pen`-Datei). Entscheidung 5A: Das
[UserMenu des Nuxt-UI-Dashboard-Templates](https://github.com/nuxt-ui-templates/dashboard/blob/main/app/components/UserMenu.vue)
ist die verbindliche Design-Vorlage — übernommen werden das „Appearance"-Submenu (hier um **System**
ergänzt) sowie das „Theme"-Submenu mit den „Primary"- und „Neutral"-Chip-Submenus.

## Frontend-Umsetzung (Handoff)

Abweichend vom Standard-Handoff startet **kein** `pencil-nuxt-implementer`, weil kein Pencil-Design
existiert (Entscheidung 5A). Der PRD-Implementierungs-Agent baut die UI **nach** der
Backend-Umsetzung (Schema, Service, API aus `## Umsetzung`) direkt mit Nuxt-UI-Komponenten. Vorlage
ist das Template-UserMenu aus `## Pencil-Screens`; Zielflächen sind die Components und Menüs aus
`## Umsetzung`, Schritte 9 und 11.

## Datenmodell

Keine neue Tabelle. Erweiterung von `server/database/schema/users.ts` nach dem jsonb-Muster aus
`server/database/schema/auth-providers.ts` (`config: jsonb(...).notNull().default({})`):

| Spalte (TS / DB) | Typ | Bedeutung |
|---|---|---|
| `preferences` / `preferences` | `jsonb` NOT NULL DEFAULT `'{}'::jsonb`, `$type<UserPreferences>()` | Nutzer-Preferences; aktuell `colorMode` und `primaryColor`, künftige Keys ohne Migration erweiterbar |

Typ und Konstanten in `shared/user-preferences.constants.ts` (Muster: `shared/content-creator.constants.ts`):

```typescript
export const COLOR_MODES = ['light', 'dark', 'system'] as const
export const PRIMARY_COLORS = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'] as const
export const NEUTRAL_COLORS = ['slate', 'gray', 'zinc', 'neutral', 'stone'] as const

export type ColorMode = typeof COLOR_MODES[number]
export type PrimaryColor = typeof PRIMARY_COLORS[number]
export type NeutralColor = typeof NEUTRAL_COLORS[number]

export interface UserPreferences {
  colorMode?: ColorMode
  primaryColor?: PrimaryColor
  neutralColor?: NeutralColor
}
```

Kein Index (keine Abfragen über `preferences`), keine neuen `relations()`. Migration:
`pnpm db:generate` → `pnpm db:migrate`.

## Umsetzung (Feature-Anatomie)

Gemappt auf die 11-Schritt-Checkliste aus `_ARCHITECTURE.md`. Das Feature erweitert den
bestehenden profile-Slice.

1. **Schema** — `server/database/schema/users.ts` um `preferences` erweitern (siehe Datenmodell);
   Shared-Typ aus `~~shared/user-preferences.constants` referenzieren.
2. **ItemService** — keiner neu: `getUsersItemService()` existiert in `server/utils/container.ts:109`
   und ist im `profileService` bereits injiziert.
3. **Feature-Service** — `server/features/profile/profile.service.ts`:
   - Neue Methode `updatePreferences(userId, input: UserPreferences): Promise<UserPreferences>` —
     Nutzer per `usersItemService.readOne(userId)` laden (404 wenn fehlt), flach mergen
     (`{ ...user.preferences, ...input }`), per `usersItemService.update(userId, { preferences })`
     schreiben, gemergtes Objekt zurückgeben.
   - `UserProfile`-Interface und `getProfile`/`updateProfile`-Rückgaben um `preferences` ergänzen.
4. **Wire Service** — keine Änderung: `profileService` ist in `server/utils/container.ts:284`
   verdrahtet.
5. **API-Route** — `server/api/profile/preferences.put.ts`, dünn und delegierend nach dem Muster von
   `server/api/profile/index.put.ts`: `requireAuth(event)`, Zod-v4-Schema
   `z.strictObject({ colorMode: z.enum(COLOR_MODES).optional(), primaryColor: z.enum(PRIMARY_COLORS).optional(), neutralColor: z.enum(NEUTRAL_COLORS).optional() })`,
   bei Fehler `createError({ status: 400, statusText: … })`, sonst
   `container.profileService.updatePreferences(user.id, parsed.data)` → `{ preferences }`.
   Alle `nuxt/server`-Helfer explizit importieren (`createError`, `defineEventHandler`, `readBody`).
6. **Client-API** — `app/features/profile/api/profile.api.ts`:
   `updatePreferences: (data: UserPreferences): Promise<{ preferences: UserPreferences }>` →
   `$api('/api/profile/preferences', { method: 'PUT', body: data })`.
7. **Query-Keys** — keine neuen Keys. Betroffene Caches existieren: `profileKeys.profile()` und
   `authKeys.session()` (Preferences reisen in der Session-Antwort mit, weil
   `server/api/auth/session.get.ts` den vollen Context-User liefert).
8. **Composables** — `app/features/profile/composables/useAppearance.ts`:
   - `useAppearance()` — zentrale Logik: liest `useSession()` (`user`, `isAnonymous`,
     `isImpersonating`), kapselt `applyPreferences(prefs)` (setzt `colorMode.preference`,
     `appConfig.ui.colors.primary` und `appConfig.ui.colors.neutral`) und `setAppearance(input)` (sofort anwenden; nur für
     nicht-anonyme Nutzer ohne aktive Impersonation zusätzlich die Mutation feuern).
   - `useUpdatePreferences()` in `useProfileMutations.ts` — `useMutation` auf
     `profileApi.updatePreferences`; `onSettled` invalidiert `profileKeys.profile()` und
     `authKeys.session()`; `onError` zeigt einen Toast und wendet den letzten Serverstand
     (`user.preferences`) wieder an.
9. **Components / Menü-Definition** — `app/features/profile/composables/useAppearanceMenuItem.ts`:
   liefert `appearanceMenuItems` — die Gruppe aus „Theme" (Icon `i-lucide-palette`, mit „Primary"-
   und „Neutral"-Chip-Submenus) und „Appearance" (Icon `i-lucide-sun-moon`, mit drei
   Modus-Checkbox-Items) nach Template-Vorlage (`slot: 'chip'`, `chip: <farbe>`, `checked` gegen
   aktuellen Wert, `onSelect` mit `e.preventDefault()` → `setAppearance(...)`). Für das
   Chip-Rendering rendert jedes konsumierende `UDropdownMenu` im `#chip-leading`-Slot die
   Komponente `AppearanceColorChip` (`app/features/profile/components/`). Integration:
   - `app/components/AppHeader.vue` — beide Items als Gruppe in `userMenuItems` vor „Sign out"
     einhängen; `UColorModeButton` entfernen; für Gäste/anonyme Nutzer stattdessen ein
     `UDropdownMenu` mit Icon-Button (`i-lucide-sun-moon`) und nur den drei Modus-Items
     (ohne Persistenz) rendern.
   - `app/layouts/dashboard.vue` und `app/layouts/admin.vue` — beide Items als Gruppe in die
     jeweiligen `userMenuItems` vor „Sign out" einhängen.
10. **Barrel-Export** — `app/features/profile/index.ts`: `useAppearance`, `useAppearanceMenuItem`
    (liefert `appearanceMenuItems`, `colorModeMenuItems`), `useUpdatePreferences` und den
    Re-Export des Typs `UserPreferences` ergänzen.
11. **Pages / Routen** — keine neuen Pages oder Routen-Konstanten. Anwendung beim Laden: in
    `app/app.vue` ein `watch` auf `useSession().user` mit `{ immediate: true }`, das
    `applyPreferences(user.preferences)` für nicht-anonyme Nutzer aufruft (greift bei SSR-Render,
    Login, Logout und Impersonations-Wechsel; die Session ist dank `app/plugins/api.ts` beim
    SSR-Render bereits im Cache).

## Technische Hinweise

- **SSR ohne Farb-Blitz:** Der Session-Cache ist durch `app/plugins/api.ts` schon beim Server-Render
  gefüllt. Das `watch` mit `immediate: true` in `app.vue` setzt `appConfig.ui.colors.primary`
  deshalb bereits im SSR-HTML. Den Modus verwaltet das color-mode-Modul mit eigenem Storage und
  Inline-Script; `colorMode.preference` aus der DB zu setzen gleicht lokalen und DB-Stand an —
  die DB gewinnt bei Differenz.
- **Typen durchziehen:** `AuthUser` (`app/features/auth/types/auth.types.ts`) und `UserProfile`
  (Client `app/features/profile/types/profile.types.ts` + Server) um
  `preferences: UserPreferences` erweitern. Der Typ kommt aus `~~shared/user-preferences.constants`
  bzw. Client-seitig über den Alias `#shared`/`~~shared` — keine Cross-Feature-Duplikate.
- **Zod v4:** Enum-Validierung über `z.enum(COLOR_MODES)` / `z.enum(PRIMARY_COLORS)` aus den
  Shared-Konstanten; `.trim()` entfällt, weil keine freien Strings akzeptiert werden. Unbekannte
  Body-Keys weist das Schema zurück.
- **Cache-Invalidierung (Pinia Colada):** Nach der Mutation `profileKeys.profile()` **und**
  `authKeys.session()` invalidieren — beide Antworten tragen `preferences`. Keine Listen betroffen,
  kein Detail-Cache zu clearen.
- **Optimistisches UI:** `setAppearance` wendet Werte vor der Server-Antwort an. Schlägt die
  Mutation fehl, stellt `onError` den letzten Serverstand aus `user.preferences` wieder her und
  zeigt einen Toast (Muster: `useToast()` wie in `AppHeader.vue`).
- **Guards:** `requireAuth` aus `server/features/auth/auth.guard.ts` reicht — keine Permission
  nötig, jeder Nutzer ändert nur die eigene Zeile. Anonyme Nutzer erreichen den Endpoint praktisch
  nicht (Menü ausgeblendet); falls doch, ist das Schreiben der eigenen Zeile unkritisch.
- **Menü-Verhalten:** Checkbox-/Chip-Items brauchen `e.preventDefault()` in `onSelect`, damit das
  Dropdown beim Umschalten offen bleibt (wie im Template-UserMenu).

**Anti-Patterns vermeiden** (`_ARCHITECTURE.md`):

- Keine Business-Logik in der API-Route — Merge und Validierungsregeln leben im `profileService`.
- Keine direkten DB-Queries in Routen — nur über `profileService`/ItemService.
- Keine API-Calls aus Components — Menü-Items rufen Composables, Composables die Mutation.
- Keine Cross-Feature-Imports am `index.ts` vorbei — Layouts/Header importieren aus
  `~/features/profile`.
- Keine hartkodierten Query-Keys — `profileKeys`/`authKeys`-Factories verwenden.
- Keine fehlende Cache-Invalidierung nach der Mutation (Session **und** Profile).

## Erfolgskriterien

- Ein eingeloggter, nicht-anonymer Nutzer wählt im User-Menü (Header, dashboard- und admin-Layout)
  unter „Appearance" Light/Dark/System sowie unter „Theme" eine der 17 Primary- und eine der
  5 Neutral-Farben; alles wirkt sofort.
- `PUT /api/profile/preferences` schreibt den gemergten Wert in `users.preferences`; ungültige Werte
  (z. B. `primaryColor: 'mint'`) beantwortet der Endpoint mit 400; ohne Session kommt 401.
- Nach Reload und auf einem zweiten Gerät (gleicher Account) rendert die App Modus und
  Primary-Farbe aus der DB — auch im SSR-HTML ohne sichtbaren Farbwechsel beim Hydrieren.
- Gäste und anonyme Nutzer sehen im Header nur das Modus-Dropdown (drei Optionen, keine Farbwahl);
  ihre Wahl löst keinen Request auf `/api/profile/preferences` aus. Der `UColorModeButton` ist
  entfernt.
- Während einer Impersonation ändert die Theme/Appearance-Auswahl die Darstellung lokal, sendet
  aber keine Mutation; `users.preferences` des impersonierten Nutzers bleibt unverändert.
- Ein Nutzer ohne gespeicherte Preferences sieht die Defaults (System-Modus, `fuchsia`, `slate`).
- `pnpm lint` und `pnpm typecheck` sind grün; die Migration für `users.preferences` läuft mit
  `pnpm db:migrate` fehlerfrei durch.
