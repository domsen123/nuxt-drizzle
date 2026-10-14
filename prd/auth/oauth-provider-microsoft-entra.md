# PRD: Konfigurierbare OAuth-Provider — Microsoft Entra ID + Registrierungs-Policy

> Status: geplant · Scope: Admin-konfigurierbarer OAuth-Login mit Microsoft Entra ID (Azure AD).
> `/admin/settings/authentication` erhält eine Microsoft-Provider-Karte (Client ID, Client Secret,
> Tenant, Enable/Disable) und eine globale Registrierungs-Einstellung (offen vs. nur Eingeladene).
> `/auth/sign-in` und `/auth/sign-up` rendern Provider-Buttons aus der DB statt der hartkodierten
> Google/GitHub-Dummies. Neue OAuth-Endpoints unter `server/api/auth/oauth/[provider]/*`.

## Context

Die App authentifiziert bisher ausschließlich über die selbst implementierte Credentials-Auth
(httpOnly-Session-Cookie) plus den Anonymous-Provider. Auf `/auth/sign-in` und `/auth/sign-up`
liegen hartkodierte Google/GitHub-Buttons, die nur einen „coming soon"-Toast zeigen
(`app/pages/auth/sign-in.vue`, `app/pages/auth/sign-up.vue`). Für den Einsatz in Organisationen mit
Microsoft-365-Umgebung fehlt ein echter SSO-Login.

Dieses PRD führt den ersten echten OAuth-Provider ein: **Microsoft Entra ID** (Azure AD), vollständig
zur Laufzeit über `/admin/settings/authentication` konfigurierbar — ohne Env-Variablen, ohne Deploy.
Zusätzlich kommt eine globale **Registrierungs-Policy**: Der Admin entscheidet, ob sich jeder
registrieren darf (Auto-Register) oder nur eingeladene Personen.

**Bewusste Wiederverwendung statt Neubau** — die Provider-Infrastruktur existiert bereits:

- Tabelle `auth_providers` (`server/database/schema/auth-providers.ts`): `provider` (unique),
  `enabled`, `config` (jsonb), `displayOrder` — nimmt Microsoft ohne Schemaänderung auf.
- `authProvidersService` (`server/features/auth/auth-providers.service.ts`): Provider-Lookup mit
  1-Minuten-Cache, `listProviders`, `updateProvider` — wird um Secret-Verschlüsselung und Maskierung
  erweitert.
- Admin-Endpoints `GET /api/admin/settings/auth-providers` und
  `PUT /api/admin/settings/auth-providers/[provider]` (`requireSuperAdmin`) — bleiben die Basis.
- Admin-UI: `app/pages/admin/settings/authentication.vue` + `AdminAuthProviderCard.vue`,
  `useAdminAuthProviders`/`useUpdateAuthProvider`, `adminKeys.authProviders` — werden erweitert.
- `users` hat bereits `authProvider`, nullable `email`/`passwordHash` — OAuth-Nutzer ohne Passwort
  sind heute schon abbildbar.
- Verschlüsselungsmuster für Secrets: AES-256-GCM aus
  `server/features/content-creator/crypto.utils.ts` (Key aus `NUXT_AUTH_SECRET`) — wird als eigenes
  Util im Auth-Slice gespiegelt.
- Einladungen: bestehendes `organisation-invitations`-System inkl. Accept-Flow
  (`/auth/accept-invitation?token=…`) — definiert, wer „eingeladen" ist.

**Was es bewusst *nicht* ist:** kein Ersatz der Credentials-Auth, kein generisches
Multi-IdP-Framework mit Discovery/JWKS, kein Google-/GitHub-Login (die Dummies fliegen raus), keine
Account-Verwaltungs-UI zum manuellen Verknüpfen/Trennen von Identitäten, kein SCIM/Provisioning.

## Produktentscheidungen (final)

| Thema | Entscheidung |
|---|---|
| Erster Provider | Microsoft Entra ID (Azure AD), Microsoft Identity Platform **v2** |
| OAuth-Implementierung | **Selbst implementiert**: Authorization Code Flow + **PKCE (S256)** + `state`; Userinfo via `https://graph.microsoft.com/oidc/userinfo` (Access-Token im Header) — dadurch **keine** ID-Token-/JWKS-Validierung nötig; **keine neue Dependency** (Self-Auth-Hausstil) |
| Microsoft-Endpoints | Authorize `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize`, Token `…/oauth2/v2.0/token`, Scopes `openid profile email` |
| Redirect URI | `${NUXT_PUBLIC_SITE_URL}/api/auth/oauth/microsoft/callback`; die Admin-Karte zeigt sie read-only mit Copy-Button (für die Azure-App-Registrierung) |
| Provider-Konfiguration | In `auth_providers.config` (jsonb): `clientId` (string), `tenant` (string: `common` \| `organizations` \| `consumers` \| Tenant-GUID), `clientSecret` als **AES-256-GCM-Tripel** `{ encrypted, iv, tag }` — nie im Klartext in der DB |
| Secret-Verschlüsselung | Neues Util `server/features/auth/config-crypto.utils.ts`, gespiegelt von `content-creator/crypto.utils.ts` (AES-256-GCM, Key = SHA-256 von `config.security.auth_secret`); **kein** Cross-Feature-Import aus content-creator |
| Secret in Admin-Responses | Write-only: `GET` liefert die config **ohne** `clientSecret`, stattdessen `clientSecretSet: boolean`. `PUT` ohne `clientSecret` behält das gespeicherte Secret; mit Wert wird neu verschlüsselt |
| Enable-Validierung | `enabled: true` für `microsoft` nur, wenn `clientId`, `tenant` und ein Secret vorhanden sind — sonst 400 |
| Account-Matching | **Auto-Linking per E-Mail**: Liefert Microsoft eine E-Mail (lowercase) eines bestehenden Accounts, wird eine `user_identities`-Zeile angelegt und der Nutzer eingeloggt. IdP-E-Mail gilt als verifiziert (`emailVerified: true` wird gesetzt, falls noch false) |
| Identitäts-Speicherung | Neue Tabelle `user_identities` (`provider` + `providerAccountId` unique); `providerAccountId` = `sub` aus dem Userinfo-Response |
| Neue Nutzer via Microsoft | `users`-Zeile mit `email`, `name`, `authProvider: 'microsoft'`, `emailVerified: true`, `passwordHash: null` + Identity-Zeile + Event `auth:user-registered` (RBAC-Default-Rolle greift wie bisher) |
| Registrierungs-Policy | **Global, alle Wege**: `mode: 'open' \| 'invite_only'`. Bei `invite_only` sind Credentials-Sign-up **und** Neuanlage via OAuth gesperrt |
| „Eingeladen" heißt | Offene, nicht abgelaufene, nicht angenommene Organisations-Einladung für die E-Mail **oder** ein bereits existierender User-Account mit dieser E-Mail |
| Policy-Speicherort | Neue generische Key-Value-Tabelle `app_settings`; Eintrag `auth.registration` → `{ "mode": "open" }` (Seed-Default: `open`) |
| Accept-Invitation-Flow | Bleibt unverändert — der Token ist die Einladung; dieser Weg funktioniert auch bei `invite_only` |
| Anonymous-Provider | Unberührt von der Registrierungs-Policy; weiterhin nur über seinen eigenen `enabled`-Schalter gesteuert |
| Anonymous-Upgrade via Microsoft | Hat der Request eine anonyme Session und die Microsoft-E-Mail gehört **keinem** Account: anonymer User wird upgegradet (E-Mail, Name, `authProvider: 'microsoft'`, `emailVerified: true`) — analog zum Credentials-Upgrade in `register.post.ts`. Gehört die E-Mail einem anderen Account: normaler Login, neue Session ersetzt die anonyme |
| Session nach OAuth-Login | Normale Web-Session via Cookie, Dauer wie „Remember me" (`remember: true`) |
| State/PKCE-Zwischenspeicher | Drei kurzlebige httpOnly-Cookies (`oauth_state`, `oauth_verifier`, `oauth_redirect`), 10 Minuten, `sameSite: 'lax'`, `secure` in Produktion; nach dem Callback gelöscht |
| Redirect nach Login | `redirect`-Query des Authorize-Aufrufs wird im Cookie mitgeführt; nur interne Pfade erlaubt (beginnt mit `/`, nicht mit `//`), sonst `ROUTES.start` |
| Fehlerbehandlung Callback | Kein JSON-Fehler: Redirect auf `/auth/sign-in?error=<code>` (`oauth_failed`, `oauth_no_email`, `provider_disabled`, `registration_disabled`); die Sign-in-Seite mappt den Code über i18n auf eine `UAlert` |
| Public-Endpoint | Neu: `GET /api/auth/providers` (ohne Auth) → `{ providers: [{ provider: 'microsoft' }], registration: { mode } }` — nur **aktivierte OAuth-Provider**, sortiert nach `displayOrder`, nie config/secrets |
| Sign-in/Sign-up-Buttons | Beide Seiten ersetzen die Google/GitHub-Dummies durch Buttons aus `GET /api/auth/providers`; Microsoft-Button: Label `Microsoft` (Markenname, unübersetzt), Icon `i-simple-icons-microsoft` (im installierten Iconset vorhanden), Klick = Full-Page-Navigation auf `/api/auth/oauth/microsoft/authorize?redirect=…` |
| Google/GitHub | Ersatzlos entfernt (Buttons + i18n-Keys `auth.signIn.providerSoon`, `auth.signUp.providerSoon`); keine Seed-Zeilen für Google/GitHub |
| Invite-only in der UI | `/auth/sign-up` zeigt bei `invite_only` eine Info-`UAlert` statt des Formulars; `/auth/sign-in` blendet den „Sign up"-Footer-Link aus. Serverseitige Durchsetzung bleibt maßgeblich |
| Admin-UI Registrierung | Eigene Karte `AdminRegistrationSettingsCard` oben auf `/admin/settings/authentication` (URadioGroup: „Everyone can sign up" / „Invite only"), Endpoints `GET/PUT /api/admin/settings/registration` (`requireSuperAdmin`) |
| Admin-UI Microsoft-Karte | Erweiterung von `AdminAuthProviderCard`: Enabled-Switch, Client ID (`UInput`), Client Secret (`UInput type="password"`, Placeholder „Secret is set — leave blank to keep" wenn `clientSecretSet`), Tenant (`USelectMenu`: `common` / `organizations` / `consumers` / `Custom tenant ID` + GUID-`UInput` bei Custom), Redirect-URI read-only. Admin bleibt Englisch (kein `$t`) |
| Seed | `seedAuthProviders` in `server/plugins/01.init.ts` wird zum **Per-Provider-Upsert** (fehlende Zeilen nachziehen statt „einmal gesamt"): `credentials` (enabled, order 0), `anonymous` (disabled, order 1), `microsoft` (disabled, config `{}`, order 2). Zusätzlich Seed `app_settings['auth.registration'] = { mode: 'open' }`, falls fehlend |
| `users.authProvider` | Neue Microsoft-Nutzer erhalten `'microsoft'`; bei Auto-Linking behält der Account seinen bestehenden Wert (Spalte ist informativ) |
| Rate-Limiting | Nicht Teil dieses PRDs (im Projekt existiert keine Rate-Limiting-Infrastruktur; `nuxt.config.ts` hat keine `routeRules`) |
| Pencil-Design | Es existieren keine Pencil-Frames für dieses Feature; die UI wird **ohne** Pencil-Vorlage anhand der bestehenden Komponenten-Muster umgesetzt (Nutzer-Entscheidung) |

## Scope

**In Scope**

- Tabellen `user_identities` und `app_settings` (+ Migration via `pnpm db:generate` → `pnpm db:migrate`).
- Util `server/features/auth/config-crypto.utils.ts` (AES-256-GCM encrypt/decrypt für Provider-Secrets).
- Service `server/features/auth/oauth.service.ts`: Authorize-URL bauen, Callback abwickeln
  (Code-Tausch, Userinfo, Identity-Lookup, Auto-Linking, Policy-Check, Session).
- Service `server/features/admin/app-settings.service.ts`: generisches `getSetting`/`setSetting`
  mit Cache (Muster `auth-providers.service.ts`).
- Service `server/features/auth/registration-policy.service.ts`: `getMode()`, `canRegister(email)`.
- Erweiterung `auth-providers.service.ts` (Secret-Verschlüsselung/-Maskierung, Merge-Update) und
  `auth.service.ts` (`createSessionForUser`, Microsoft-Upgrade/-Neuanlage).
- Endpoints: `GET /api/auth/oauth/[provider]/authorize`, `GET /api/auth/oauth/[provider]/callback`,
  `GET /api/auth/providers`, `GET/PUT /api/admin/settings/registration`; Anpassung
  `PUT /api/admin/settings/auth-providers/[provider]` (Provider-spezifische Zod-Schemas) und
  `GET /api/admin/settings/auth-providers` (Maskierung) sowie `POST /api/auth/register` (Policy-Check).
- Seed-Umbau in `server/plugins/01.init.ts` (Upsert + `app_settings`-Default).
- Admin-UI: Microsoft-Branch in `AdminAuthProviderCard`, neue `AdminRegistrationSettingsCard`,
  Erweiterung `app/pages/admin/settings/authentication.vue`.
- Public-UI: Provider-Buttons aus der DB auf `/auth/sign-in` und `/auth/sign-up`, Fehler-Alert aus
  `?error=`, Invite-only-Gating beider Seiten; neue i18n-Keys (en/de), alte `providerSoon`-Keys raus.
- Client-Slices: `app/features/auth` (Public-Providers-Query) und `app/features/admin`
  (Registration-Settings-Query/-Mutation, erweiterte Typen).

**Out of Scope**

- Weitere OAuth-Provider (Google, GitHub, …) — die Architektur nimmt sie später als weitere
  `auth_providers`-Zeilen + Service-Branches auf, gebaut wird hier nur Microsoft.
- ID-Token-Validierung (JWKS), Single-Logout, Refresh-Tokens gegen Microsoft (die App nutzt nur den
  einmaligen Code-Tausch + Userinfo; danach gilt die eigene Session).
- UI zum manuellen Verknüpfen/Trennen von Identitäten im Profil (Auto-Linking ist der einzige Weg).
- Gruppen-/Rollen-Mapping aus Entra ID (Claims → RBAC).
- Mobile-/Bearer-Flow (separates PRD `prd/auth/mobile-bearer-token-auth.md`).
- Rate-Limiting-Infrastruktur.

## Pencil-Screens

Kein Pencil-Screen — für dieses Feature existieren keine Frames, und die Pencil-App war zum
PRD-Zeitpunkt nicht erreichbar. Finale Entscheidung des Nutzers: Die UI wird **ohne** Pencil-Vorlage
umgesetzt und folgt den bestehenden Komponenten-Mustern (`AdminAuthProviderCard`-Kartenlayout mit
`UPageCard`/`UFormField`, `UAuthForm`-Provider-Slot der Auth-Seiten).

## Frontend-Umsetzung (Handoff)

Der Agent `pencil-nuxt-implementer` wird für dieses PRD **nicht** gestartet — es gibt keine
Pencil-Frames als Design-Referenz. Die Frontend-Umsetzung erfolgt durch den
PRD-Implementierungs-Agenten selbst, **nach** der Backend-Umsetzung (Schema, Services, API, DI aus
`## Umsetzung`), ausschließlich entlang der bestehenden Muster:

- Admin: `AdminAuthProviderCard.vue` als Vorlage für den Microsoft-Branch;
  `AdminRegistrationSettingsCard.vue` im Stil der bestehenden Karten (Header-`UPageCard` mit
  Save-Button + `UPageCard variant="subtle"` mit Feldern). Admin-Texte Englisch, kein `$t`.
- Public: `UAuthForm`-`providers`-Prop der Seiten `sign-in.vue`/`sign-up.vue` (Struktur wie die
  bisherigen Dummy-Einträge: `{ label, icon, onClick }`), Alerts als `UAlert` wie der bestehende
  `apiError`-Block.

## Datenmodell

Konventionen: ULID-`id` (`text`), `snake_case` (DB) / `camelCase` (TS), Timestamps `withTimezone`,
Relationen via `relations()`. Drizzle-Workflow: `pnpm db:generate` → `pnpm db:migrate`.

**Neue Tabelle `user_identities`** — `server/database/schema/user-identities.ts`

| Spalte (TS / DB) | Typ | Bedeutung |
|---|---|---|
| `id` / `id` | `text` PK (ULID) | Primärschlüssel |
| `userId` / `user_id` | `text` NOT NULL, FK → `users.id` `onDelete: 'cascade'` | Verknüpfter Account |
| `provider` / `provider` | `text` NOT NULL | Provider-Name (`microsoft`) |
| `providerAccountId` / `provider_account_id` | `text` NOT NULL | `sub` aus dem Userinfo-Response (stabile IdP-User-ID) |
| `email` / `email` | `text` NULL | E-Mail, wie vom IdP beim letzten Login gemeldet (Audit/Anzeige) |
| `createdAt` / `created_at` | `timestamptz` NOT NULL `defaultNow()` | Erstellzeit |
| `updatedAt` / `updated_at` | `timestamptz` NOT NULL `defaultNow()` | Letzte Änderung |

Indizes: Unique-Index auf (`provider`, `provider_account_id`), Index auf `user_id`.
`relations()`: `userIdentities.userId → users` (one), `users → many(userIdentities)` — Ergänzung in
`server/database/schema/relations.ts`, Export im Barrel `server/database/schema/index.ts`.

**Neue Tabelle `app_settings`** — `server/database/schema/app-settings.ts`

| Spalte (TS / DB) | Typ | Bedeutung |
|---|---|---|
| `id` / `id` | `text` PK (ULID) | Primärschlüssel |
| `key` / `key` | `text` NOT NULL UNIQUE | Setting-Schlüssel (hier: `auth.registration`) |
| `value` / `value` | `jsonb` NOT NULL `default({})` | Setting-Wert (hier: `{ "mode": "open" \| "invite_only" }`) |
| `createdAt` / `created_at` | `timestamptz` NOT NULL `defaultNow()` | Erstellzeit |
| `updatedAt` / `updated_at` | `timestamptz` NOT NULL `defaultNow()` | Letzte Änderung |

Keine Relationen. Export im Barrel.

**Bestehende Tabelle `auth_providers`** — unverändert. Dokumentierte config-Form der
Microsoft-Zeile (jsonb):

```json
{
  "clientId": "00000000-0000-0000-0000-000000000000",
  "tenant": "common",
  "clientSecret": { "encrypted": "<hex>", "iv": "<hex>", "tag": "<hex>" }
}
```

**Bestehende Tabelle `users`** — unverändert (`email`/`passwordHash` sind bereits nullable,
`authProvider` existiert).

## Umsetzung (Feature-Anatomie)

Gemappt auf die 11-Schritt-Checkliste aus `_ARCHITECTURE.md` (+ Schritt 12 i18n). Server-Teil im
Auth-Slice mit direktem Drizzle-Zugriff (bestehendes Muster von `auth.service.ts`).

1. **Schema** — `server/database/schema/user-identities.ts` und
   `server/database/schema/app-settings.ts` (siehe Datenmodell), Barrel + `relations.ts` ergänzen;
   `pnpm db:generate` → `pnpm db:migrate`.

2. **ItemService** — *N/A*. Der Auth-Slice nutzt direkten Drizzle-Zugriff (wie `auth.service.ts`
   und `auth-providers.service.ts`); `app_settings` wird über den eigenen Service gekapselt.

3. **Feature-Services** —
   - `server/features/auth/config-crypto.utils.ts`: `encryptSecret(plaintext)` →
     `{ encrypted, iv, tag }`, `decryptSecret(encrypted, iv, tag)`. Exakt das Muster aus
     `server/features/content-creator/crypto.utils.ts` (AES-256-GCM, Key = SHA-256 über
     `config.security.auth_secret`), als Kopie im Auth-Slice — kein Cross-Feature-Import.
   - `server/features/admin/app-settings.service.ts` (`createAppSettingsService({ db })`):
     `getSetting<T>(key, fallback)` mit 1-Minuten-Cache (Muster `auth-providers.service.ts`),
     `setSetting(key, value)` als Upsert (`onConflictDoUpdate` auf `key`) + Cache-Invalidierung.
   - `server/features/auth/registration-policy.service.ts`
     (`createRegistrationPolicyService({ db, appSettingsService })`):
     - `getMode()` → `'open' | 'invite_only'` aus `app_settings['auth.registration']`,
       Fallback `'open'`.
     - `canRegister(email)` → `true` bei `mode === 'open'`; bei `invite_only`: `true`, wenn in
       `organisation_invitations` eine offene Einladung für die E-Mail existiert (nicht angenommen,
       nicht abgelaufen — Felder gemäß `server/database/schema/organisation-invitations.ts`),
       sonst `false`. (Ein existierender Account zählt ebenfalls als „eingeladen", wird aber im
       OAuth-Flow bereits vor dem `canRegister`-Check als Login/Linking behandelt; im
       Credentials-Register-Flow endet eine existierende E-Mail ohnehin als 409.)
   - `server/features/auth/oauth.service.ts`
     (`createOauthService({ db, authProvidersService, authService, registrationPolicyService })`):
     - `buildAuthorizationRedirect(provider)` — Provider laden (`authProvidersService.getProvider`),
       `enabled` prüfen (sonst Fehlercode `provider_disabled`), `state` (`randomBytes(32).toString('hex')`)
       und PKCE-Verifier erzeugen, S256-Challenge berechnen, Authorize-URL mit `client_id`,
       `redirect_uri`, `response_type=code`, `scope=openid profile email`, `state`,
       `code_challenge(+_method)` bauen; gibt `{ url, state, verifier }` zurück.
     - `handleCallback(provider, { code, state, expectedState, verifier, anonymousUser })` —
       State-Abgleich; Token-Tausch per `fetch` gegen den Token-Endpoint (Body: `client_id`,
       entschlüsseltes `client_secret`, `grant_type=authorization_code`, `code`, `redirect_uri`,
       `code_verifier`); Userinfo von `https://graph.microsoft.com/oidc/userinfo` →
       `{ sub, email, name }`. Fehlende E-Mail → Fehlercode `oauth_no_email`. Dann in dieser
       Reihenfolge:
       1. Identity (`provider` + `sub`) existiert → zugehörigen User laden, Login.
       2. Sonst User mit `email` (lowercase) existiert → Identity anlegen, `emailVerified: true`
          setzen falls false, Login (Auto-Linking).
       3. Sonst `anonymousUser` vorhanden → Upgrade dieser `users`-Zeile (E-Mail, Name,
          `authProvider: 'microsoft'`, `emailVerified: true`) + Identity, Event
          `auth:user-registered`.
       4. Sonst Neuanlage: `registrationPolicyService.canRegister(email)`; bei `false` Fehlercode
          `registration_disabled`; sonst `users`-Zeile + Identity + Event `auth:user-registered`.
       Rückgabe: `{ user, session, token }` via `authService.createSessionForUser`.
   - Erweiterung `server/features/auth/auth.service.ts`: `createSessionForUser(userId, remember = true)`
     — exponiert das interne `createSession` (Session + Token), damit `oauth.service` keine
     Session-Logik dupliziert.
   - Erweiterung `server/features/auth/auth-providers.service.ts`:
     - `listProvidersMasked()` — wie `listProviders`, ersetzt in der config `clientSecret` durch
       Flag `clientSecretSet: boolean`.
     - `updateProvider` — merged Secrets: eingehendes `clientSecret` (string) wird via
       `encryptSecret` zum Tripel; fehlt es, bleibt das gespeicherte Tripel erhalten. Validiert
       beim Aktivieren von `microsoft` die Vollständigkeit (`clientId`, `tenant`, Secret) und
       wirft sonst 400.

4. **Wire Services** — in `server/utils/container.ts`: `appSettingsService`,
   `registrationPolicyService`, `oauthService` registrieren (lazy-Getter + Typ-Exports, analog
   `authProvidersService`).

5. **API-Routen** (dünn, delegierend; `nuxt/server`-Imports; Zod v4 mit `.trim()`) —
   - `server/api/auth/oauth/[provider]/authorize.get.ts` — Provider-Param lesen
     (`{ decode: true }`), `redirect`-Query validieren (nur interner Pfad), `oauthService.buildAuthorizationRedirect`;
     Cookies `oauth_state`, `oauth_verifier`, `oauth_redirect` setzen (httpOnly, `sameSite: 'lax'`,
     `secure` in Produktion, `maxAge: 600`); 302 auf die Microsoft-URL. Bei deaktiviertem/unbekanntem
     Provider: Redirect auf `/auth/sign-in?error=provider_disabled`.
   - `server/api/auth/oauth/[provider]/callback.get.ts` — `code`/`state`/`error`-Query lesen,
     Cookies auslesen und löschen, `oauthService.handleCallback` (inkl. `anonymousUser` aus
     `event.context.user`, wenn `authProvider === 'anonymous'`); Erfolg: `setSessionCookie`
     (`server/features/auth/session.utils.ts`) + 302 auf den gespeicherten Redirect bzw.
     `ROUTES.start`. Jeder Fehlerfall: 302 auf `/auth/sign-in?error=<code>` (`oauth_failed` als
     Default). Keine Exceptions an den Browser.
   - `server/api/auth/providers.get.ts` — öffentlich: aktivierte OAuth-Provider (aktuell nur
     `microsoft`; `credentials`/`anonymous` werden herausgefiltert) sortiert nach `displayOrder`,
     plus `registration: { mode }` aus `registrationPolicyService.getMode()`. Niemals config.
   - `server/api/admin/settings/registration.get.ts` / `registration.put.ts` —
     `requireSuperAdmin`; PUT-Body: `z.object({ mode: z.enum(['open', 'invite_only']) })` →
     `appSettingsService.setSetting('auth.registration', …)`.
   - Anpassung `server/api/admin/settings/auth-providers.get.ts` → `listProvidersMasked()`.
   - Anpassung `server/api/admin/settings/auth-providers/[provider].put.ts` — Provider-spezifische
     Zod-Schemas: `microsoft` → `config: { clientId: z.string().trim().min(1), tenant:
     z.string().trim().regex(/^(common|organizations|consumers|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i),
     clientSecret: z.string().trim().min(1).optional() }`; `anonymous`/`credentials` behalten das
     bisherige generische Schema.
   - Anpassung `server/api/auth/register.post.ts` — vor `authService.register` greift
     `registrationPolicyService.canRegister(email)`; das gilt auch für den Anonymous-Upgrade-Pfad,
     denn der ist fachlich eine Neuregistrierung;
     bei `false` → `createError({ status: 403, statusText: 'Registration is invite-only', data: { code: 'auth.registration_disabled' } })`.
   - Anpassung Seed `server/plugins/01.init.ts` — `seedAuthProviders` als Per-Provider-Upsert
     (`onConflictDoNothing` auf `provider` je Default-Zeile: `credentials`/0/enabled,
     `anonymous`/1/disabled, `microsoft`/2/disabled/config `{}`); neues `seedAppSettings` legt
     `auth.registration` mit `{ mode: 'open' }` an, falls fehlend.

6. **Client-API** —
   - `app/features/auth/api/auth.api.ts`: `getPublicProviders()` →
     `GET /api/auth/providers`; Konstante `oauthAuthorizeUrl(provider, redirect?)` →
     `/api/auth/oauth/${provider}/authorize(?redirect=…)`.
   - `app/features/admin/api/admin.api.ts`: `getRegistrationSettings()`,
     `updateRegistrationSettings(data)`.

7. **Query-Keys** —
   - `app/features/auth/api/auth.keys.ts`: `publicProviders`-Key ergänzen.
   - `app/features/admin/api/admin.keys.ts`: `registrationSettings`-Key ergänzen.

8. **Composables** —
   - `app/features/auth/composables/useAuthProviders.ts`: `useQuery` auf `getPublicProviders`
     (staleTime 2 Min); liefert `providers` und `registrationMode` als computed.
   - `app/features/admin/composables/useAdminRegistrationSettings.ts`: Query + Mutation
     (`useUpdateRegistrationSettings` invalidiert `adminKeys.registrationSettings` in `onSettled`,
     Muster `useUpdateAuthProvider`).

9. **Components** —
   - `AdminAuthProviderCard.vue` erweitern: `microsoft`-Branch mit Label „Microsoft Entra ID",
     Beschreibung, Feldern Client ID / Client Secret (write-only, Placeholder bei gesetztem
     Secret) / Tenant-Select (+ GUID-Input bei Custom) / Redirect-URI read-only mit Copy-Button
     (`useRuntimeConfig().public.siteUrl` + fester Pfad). `isDirty`-Logik und `onSave`-config-Aufbau
     für Microsoft ergänzen. Englisch, kein `$t`.
   - Neu `app/features/admin/components/AdminRegistrationSettingsCard.vue`: URadioGroup
     „Everyone can sign up" / „Invite only" + Save. Englisch.
   - Typen in `app/features/admin/types/admin.types.ts`: `AdminAuthProvider.config` um
     `clientSecretSet` ergänzen, neu `AdminRegistrationSettings { mode: 'open' | 'invite_only' }`.

10. **Barrel-Exports** — `app/features/auth/index.ts` (`useAuthProviders`) und
    `app/features/admin/index.ts` (neue Card + Composables) ergänzen.

11. **Pages** —
    - `app/pages/admin/settings/authentication.vue`: `AdminRegistrationSettingsCard` als erste
      Sektion (+ Aside-Nav-Eintrag „Registration"), Microsoft-Label im Aside-Mapping.
    - `app/pages/auth/sign-in.vue`: Dummy-`providers` ersetzen durch computed aus
      `useAuthProviders()` (Microsoft → `{ label: 'Microsoft', icon: 'i-simple-icons-microsoft',
      onClick: () => navigateTo(oauthAuthorizeUrl('microsoft', route.query.redirect), { external: true }) }`);
      `?error=`-Query via `useApiErrorMessage`-analogem i18n-Mapping (`errors.auth.oauth_*`) als
      `UAlert` rendern; „Sign up"-Footer-Link nur bei `registrationMode === 'open'`.
    - `app/pages/auth/sign-up.vue`: gleiche Provider-Buttons; bei `invite_only` Info-`UAlert`
      (i18n `auth.signUp.inviteOnly`) statt Formular.
    - `app/utils/routes.ts`: unverändert (OAuth-Pfade sind API-Routen, keine Pages).

12. **i18n** (`i18n/locales/en.json` + `de.json`, identische Key-Sets) —
    - Entfernen: `auth.signIn.providerSoon`, `auth.signUp.providerSoon`.
    - Neu: `auth.signUp.inviteOnly` („Registration is currently by invitation only." /
      „Die Registrierung ist derzeit nur mit Einladung möglich."),
      `errors['auth.registration_disabled']`, `errors['auth.oauth_failed']`,
      `errors['auth.oauth_no_email']`, `errors['auth.provider_disabled']`.
    - Admin-Flächen bleiben Englisch ohne Keys.

## Technische Hinweise

- **PKCE + `state` sind Pflicht**, auch mit Client Secret: `state` gegen CSRF (Cookie-Abgleich im
  Callback), PKCE (S256) gegen Code-Injection. Verifier: `randomBytes(32)` base64url; Challenge:
  SHA-256 des Verifiers, base64url — `node:crypto` reicht, keine Dependency.
- **Kein ID-Token-Parsing:** Der Callback verwendet ausschließlich das Access-Token gegen den
  OIDC-Userinfo-Endpoint. Damit entfallen JWKS-Fetch, Signatur- und `alg`-Validierung komplett —
  die Antwort kommt direkt von Microsoft über TLS.
- **`tenant` steuert den Audience-Kreis:** `common` (alle Konten), `organizations` (nur
  Arbeits-/Schulkonten), `consumers` (nur persönliche Konten) oder eine konkrete Tenant-GUID
  (Single-Tenant). Der Wert wird in die Endpoint-URLs interpoliert.
- **Secrets:** `clientSecret` liegt nur AES-256-GCM-verschlüsselt in der DB und verlässt den Server
  nie (Admin-GET maskiert auf `clientSecretSet`). Entschlüsselung ausschließlich im Moment des
  Token-Tauschs.
- **Caching:** `authProvidersService` cached 1 Minute — ein Admin-Toggle greift auf `/auth/sign-in`
  nach spätestens 60 s plus Client-staleTime (2 Min). Akzeptiert; `updateProvider` invalidiert den
  Server-Cache sofort.
- **ItemService-Filteroperatoren** (`_eq`, `_in`, `_ilike`, …) bleiben für diesen Slice ungenutzt —
  der Auth-Slice arbeitet bewusst mit direktem Drizzle (bestehendes Muster).
- **Pinia-Colada-Cache-Invalidierung:** nach `updateAuthProvider` → `adminKeys.authProviders()`
  (bestehend); nach `updateRegistrationSettings` → `adminKeys.registrationSettings()`; die
  Public-Query (`authKeys.publicProviders`) hat 2 Min staleTime und braucht keine Invalidierung
  durch Admin-Mutationen (getrennte Nutzerkreise).
- **Zod v4** mit `.trim()` für alle String-Eingaben (Client ID, Secret, Tenant).
- **Auth/Guards:** Admin-Endpoints via `requireSuperAdmin` (`server/features/rbac/rbac.guard.ts`,
  bestehendes Muster der Settings-Routen); die OAuth- und Public-Endpoints sind bewusst ohne Guard.
  Session-Injektion läuft weiter zentral über `server/middleware/01.auth.ts`.
- **Event-Bus:** Jede Neuanlage (auch via OAuth) emittiert `auth:user-registered`, damit die
  RBAC-Default-Rolle wie bei Credentials-Registrierung zugewiesen wird (`server/plugins/01.init.ts`).
- **Open-Redirect-Schutz:** `redirect` wird nur übernommen, wenn es mit `/` beginnt und nicht mit
  `//` — sonst `ROUTES.start`.
- **Fehler-UX:** Der Callback antwortet nie mit JSON-Fehlern, sondern leitet mit `?error=<code>` auf
  die Sign-in-Seite; Codes werden dort über `errors.*`-Keys übersetzt (Konvention aus
  `_ARCHITECTURE.md` §11).

**Anti-Patterns vermeiden** (`_ARCHITECTURE.md`):
- Keine Business-Logik in API-Routen — Code-Tausch, Linking und Policy leben in
  `oauth.service`/`registration-policy.service`.
- Keine direkten DB-Queries in Routen — nur über Services.
- Keine Cross-Feature-Imports am `index.ts` vorbei (Crypto-Util wird im Auth-Slice gespiegelt statt
  aus content-creator importiert).
- Keine hartkodierten Query-Keys — neue Keys in den bestehenden Factories.
- Keine fehlende Cache-Invalidierung nach Mutationen (Registration-Settings-Mutation invalidiert).
- Keine hartkodierten User-facing Strings außerhalb /admin — alle neuen Public-Texte über i18n-Keys
  (en/de identisch); Admin bleibt Englisch ohne `$t`.
- Keine Session-Validierung in Routen — Middleware + Guards.

## Erfolgskriterien

- Auf `/admin/settings/authentication` existiert eine Microsoft-Karte: Client ID, Client Secret
  (write-only), Tenant (`common`/`organizations`/`consumers`/GUID) und Enable-Switch lassen sich
  speichern; die Redirect-URI wird angezeigt. Aktivieren ohne vollständige Config liefert 400.
- `GET /api/admin/settings/auth-providers` enthält **nie** ein Klartext-Secret, sondern
  `clientSecretSet`; in der DB steht nur das verschlüsselte Tripel.
- Bei aktiviertem Microsoft-Provider zeigt `/auth/sign-in` (und `/auth/sign-up`) einen
  Microsoft-Button; bei deaktiviertem Provider erscheint kein Button. Google/GitHub-Dummies und
  ihre `providerSoon`-Keys sind entfernt.
- Klick auf den Button durchläuft den vollständigen Flow: Redirect zu Microsoft → Callback → Session-
  Cookie → Redirect auf `redirect`-Ziel bzw. `/`. `GET /api/auth/session` liefert danach den Nutzer.
- Erstanmeldung via Microsoft erzeugt `users`-Zeile (`authProvider: 'microsoft'`,
  `emailVerified: true`, `passwordHash: null`) + `user_identities`-Zeile und weist die
  RBAC-Default-Rolle zu.
- Microsoft-Login mit der E-Mail eines bestehenden Credentials-Accounts loggt in **denselben**
  Account ein und legt genau eine Identity-Zeile an (kein Duplikat-Account, kein 409).
- Zweiter Microsoft-Login desselben IdP-Kontos nutzt die bestehende Identity (kein neuer User, auch
  wenn sich die E-Mail im IdP geändert hat — Lookup läuft über `sub`).
- Anonyme Session + Microsoft-Login mit neuer E-Mail → derselbe User-Datensatz wird upgegradet
  (ID bleibt stabil).
- Steht die Registrierung auf „Invite only": `POST /api/auth/register` ohne offene Einladung → 403
  mit `data.code = 'auth.registration_disabled'`; Microsoft-Erstanmeldung ohne offene Einladung →
  Redirect auf `/auth/sign-in?error=registration_disabled` mit übersetzter Fehlermeldung; mit
  offener Einladung gelingen beide Wege; der Accept-Invitation-Flow funktioniert unverändert;
  `/auth/sign-up` zeigt den Invite-only-Hinweis statt des Formulars.
- Manipulierter oder fehlender `state` im Callback führt zu `?error=oauth_failed`, nicht zu einer
  Session.
- Bestehende Datenbanken erhalten durch den Seed-Upsert die `microsoft`-Zeile (disabled) und den
  `app_settings`-Default `{ mode: 'open' }`, ohne bestehende Zeilen zu überschreiben.
- `pnpm lint` und `pnpm typecheck` sind grün; `en.json`/`de.json` haben identische Key-Sets.
