# PRD: Mobile Bearer-Token-Authentifizierung (Access + Refresh für native Apps)

> Status: geplant · Scope: Backend-only. Neue Token-Endpoints unter `server/api/auth/token/*`
> (`POST /api/auth/token`, `…/register`, `…/refresh`, `…/revoke`) + Geräteverwaltung
> (`GET/DELETE /api/auth/devices`), stateless Access-Token (HMAC) + rotierender Refresh-Token
> (Tabelle `refresh_tokens`). `server/middleware/auth.ts` akzeptiert zusätzlich
> `Authorization: Bearer`. Der bestehende Web-Cookie-Flow bleibt **unverändert**.

## Context

Die native Android-/iOS-App wird als **eigenständiges Projekt** gegen dieses Nitro-Backend gebaut.
Die vorhandene Auth ist session-basiert mit **httpOnly-Cookie** (`server/middleware/auth.ts` →
`getSessionToken` liest nur das Cookie `auth_session`; `AuthService.validateSession(token)` ist bereits
transport-agnostisch). Cookies sind auf nativen Clients umständlich und untergraben die saubere
Trennung, die für die App gewünscht ist — native Apps wollen ein Token im `Authorization`-Header,
gespeichert im Secure Storage (Keychain/Keystore).

Dieser PRD ergänzt einen **zweiten, parallelen Auth-Kanal** speziell für native Clients, ohne den
Web-Flow anzutasten:

- **Access-Token** — kurzlebig (15 Min), *stateless*, HMAC-SHA256-signiert. Wird bei jedem Request im
  `Authorization: Bearer`-Header mitgeschickt und ohne DB-Session-Lookup verifiziert (der Nutzer wird
  weiterhin pro Request frisch aus der DB geladen, damit Rollen/Sperren sofort greifen).
- **Refresh-Token** — langlebig (30 Tage), *opaque* Zufallswert, **gehasht** in der neuen Tabelle
  `refresh_tokens` gespeichert, mit **Rotation bei jedem Refresh** und **Reuse-Detection**
  (Diebstahlerkennung: wird ein bereits rotierter Token erneut vorgelegt, wird die gesamte
  Token-Familie gesperrt).

**Bewusste Wiederverwendung statt Neubau:** Für die Access-Token-Signatur wird **keine** neue
Dependency (`jose`/`jsonwebtoken`) eingeführt, sondern das bereits erprobte, timing-sichere
HMAC-SHA256-Muster aus `server/features/auth/qr-token.utils.ts` gespiegelt (base64url-Payload +
HMAC-Signatur + `exp`-Prüfung + `timingSafeEqual`, HS256-äquivalent). Das ist für ein
First-Party-Token (App ↔ eigenes Backend) Best Practice: die App muss das Token nie selbst
dekodieren, und das headerlose Format umgeht die JWT-`alg`-Confusion-Klasse vollständig. Das
Auth-Secret `NUXT_AUTH_SECRET` (`config.security.auth_secret`) existiert bereits.

**Was es bewusst *nicht* ist:** kein Ersatz für den Web-Cookie-Flow (der bleibt), keine zweite
Nutzer-/Passwort-Verwaltung (dieselben `users`/Credentials), kein OAuth-/Social-Login, keine
Impersonation über Bearer, keine gemischte Web+Mobile-Geräteliste, keine Client-/Frontend-Arbeit in
diesem Repo (die App-UI ist das separate Mobile-Projekt).

## Produktentscheidungen (final)

| Thema | Entscheidung |
|---|---|
| Kanal-Trennung | Zweiter, paralleler Auth-Kanal für native Clients; Web-Cookie-Flow bleibt **unverändert** |
| Access-Token — Format | Hausinternes HMAC-SHA256-Token analog `qr-token.utils`, Format `<base64url(payload)>.<base64url(sig)>`, Namespace-Prefix `at:v1:`; **keine** neue Dependency |
| Access-Token — Payload | `{ sub: userId, fid: familyId, exp: <unix-ms> }`; `fid` erlaubt `isCurrent`-Markierung & „andere abmelden" |
| Access-Token — TTL | 15 Minuten, stateless verifiziert (kein DB-Session-Lookup); Nutzer wird pro Request aus DB geladen |
| Access-Token — Widerruf | Nicht sofort widerrufbar (stateless); wirkt spätestens beim nächsten Refresh (max. 15-Min-Fenster) — akzeptierter Trade-off |
| Refresh-Token — Wert | `crypto.randomBytes(32).toString('hex')`, **nur einmal** im Response-Body ausgegeben; in DB ausschließlich als **SHA-256-Hash** (`tokenHash`) gespeichert |
| Refresh-Token — TTL | 30 Tage; bei jedem Refresh **rotiert** (alter Token sofort revoked, neuer mit frischen 30 Tagen) |
| Rotation-Familie | Jeder Login/Register startet eine neue `familyId` (= ein Geräte-Login); Rotation bleibt in derselben Familie |
| Reuse-Detection | Wird ein bereits `revokedAt`-Token erneut vorgelegt → **gesamte Familie** widerrufen, Antwort 401 |
| Login | `POST /api/auth/token` (email, password) → `{ user, accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt }`; **keine** Web-`sessions`-Zeile |
| Register | `POST /api/auth/token/register` (email, password, firstName, lastName, username) → identisches Token-Paar; Verifikations-Mail wird wie im Web asynchron versendet |
| Refresh | `POST /api/auth/token/refresh` (refreshToken) → neues Token-Paar (Rotation) |
| Logout | `POST /api/auth/token/revoke` (refreshToken) → widerruft die Familie; idempotent, kein Access-Token nötig |
| Session-Check | Bestehender `GET /api/auth/session` funktioniert per Bearer; `impersonation` ist bei Bearer immer `null` |
| Geräteverwaltung | `GET /api/auth/devices` (aktive Familien), `DELETE /api/auth/devices/:familyId`, `POST /api/auth/devices/revoke-others`; operiert auf `refresh_tokens`, nicht auf der Web-`sessions`-Tabelle |
| `deviceName` | Client darf optional `deviceName` bei Login/Register/Refresh mitschicken (z.B. „Doms iPhone"); sonst `null` |
| Middleware | `server/middleware/auth.ts` bevorzugt `Authorization: Bearer` (Access-Token → stateless verify → User aus DB); ohne Header fällt es auf den Cookie-Pfad zurück (unverändert). Kein Sliding-Cookie bei Bearer |
| Credential-/User-Aufbau | Bestehende `AuthService`-Logik wiederverwenden: `verifyCredentials` wird aus `login` extrahiert; `register` erhält eine Option, die Web-Session-Erstellung zu **überspringen** |
| Token-Logik-Ort | Neuer Service `server/features/auth/token-auth.service.ts` (direkter Drizzle-Zugriff, wie `auth.service.ts`), im Container verdrahtet; **kein** generischer ItemService |
| Rate-Limiting | Neue Endpoints via `routeRules` in `nuxt.config.ts` limitieren (Login/Register wie ihre Web-Pendants, Refresh moderat) |
| Cleanup | `cleanupExpiredRefreshTokens()` in den bestehenden Cleanup-Task (`server/api/admin/tasks/cleanup.post.ts`) aufnehmen |

## Scope

**In Scope**

- Tabelle `refresh_tokens` (+ Migration via `pnpm db:generate` → `pnpm db:migrate`).
- Utility `server/features/auth/access-token.utils.ts` (HMAC-Sign/Verify, analog `qr-token.utils.ts`).
- Service `server/features/auth/token-auth.service.ts`: `issueTokenPair`, `rotate` (inkl. Reuse-Detection),
  `revokeFamily`, `resolveAccessToken`, `listDevices`, `revokeDevice`, `revokeOtherDevices`,
  `cleanupExpiredRefreshTokens`.
- Refactor in `auth.service.ts`: `verifyCredentials(email, password)` aus `login` extrahieren;
  `register` um Option zum Überspringen der Web-Session-Erstellung erweitern.
- `server/middleware/auth.ts`: Bearer-Pfad ergänzen (Access-Token → User), Cookie-Pfad unverändert;
  `event.context.tokenFamilyId` für Bearer setzen.
- Endpoints: `POST /api/auth/token`, `…/token/register`, `…/token/refresh`, `…/token/revoke`;
  `GET /api/auth/devices`, `DELETE /api/auth/devices/[familyId]`, `POST /api/auth/devices/revoke-others`.
- `routeRules` für Rate-Limiting der neuen Endpoints; Cleanup-Erweiterung.

**Out of Scope**

- Jegliche Client-/Frontend-Arbeit (Pinia-Colada, Pages, Components) — die App ist ein separates Projekt.
- Echtes RFC-7519-JWT / `jose`-Dependency (nur nötig, falls ein Drittsystem das Token dekodieren muss).
- Impersonation über Bearer; Passwort-Reset/E-Mail-Verifikations-Bestätigung über eigene Bearer-Endpoints
  (die bestehenden Web-Endpoints bleiben die einzige Quelle, die App verlinkt sie).
- Einheitliche Geräteliste über Web-`sessions` **und** `refresh_tokens` (getrennte Sichten in v1).
- Sofortiger (< 15 Min) Widerruf von Access-Tokens; Push-/2FA-/Biometrie-Themen.

## Pencil-Screens

Kein Pencil-Screen — dieses Feature ist reine Backend-/Auth-Infrastruktur für einen externen nativen
Client und hat **keine UI in dieser Nuxt-App**. Es wurde daher bewusst kein Pencil-Frame inspiziert.

## Frontend-Umsetzung (Handoff)

Entfällt. Es gibt in dieser Nuxt-App keine zu bauende UI; `pencil-nuxt-implementer` wird für dieses
PRD **nicht** gestartet. Die Benutzeroberfläche (Login-/Geräte-Screens) entsteht im separaten
Mobile-App-Projekt und konsumiert die hier definierten JSON-Endpoints. Die Endpoints sind der
verbindliche Vertrag; die App-Seite ist nicht Teil dieses Repos.

## Datenmodell

Konventionen: ULID-`id` (`text`), `snake_case` (DB) / `camelCase` (TS), Timestamps `withTimezone`,
Relationen via `relations()`. Access-Tokens werden **nicht** gespeichert (stateless). Refresh-Tokens
werden **nur als Hash** gespeichert.

**Neue Tabelle `refresh_tokens`** — `server/database/schema/refresh-tokens.ts`

| Spalte (TS / DB) | Typ | Bedeutung |
|---|---|---|
| `id` / `id` | `text` PK (ULID) | Primärschlüssel |
| `userId` / `user_id` | `text` NOT NULL, FK → `users.id` `onDelete: cascade` | Besitzer |
| `familyId` / `family_id` | `text` NOT NULL | Rotationsfamilie = ein Geräte-Login |
| `tokenHash` / `token_hash` | `text` NOT NULL UNIQUE | SHA-256 des Roh-Refresh-Tokens (Lookup-Schlüssel) |
| `deviceName` / `device_name` | `text` NULL | Optionaler Anzeigename vom Client |
| `userAgent` / `user_agent` | `text` NULL | Aus Request-Header (Geräteanzeige) |
| `ipAddress` / `ip_address` | `text` NULL | Aus Request (Geräteanzeige) |
| `expiresAt` / `expires_at` | `timestamptz` NOT NULL | Ablauf (30 Tage ab Ausgabe) |
| `revokedAt` / `revoked_at` | `timestamptz` NULL | Gesetzt bei Rotation / Logout / Reuse-Sperre |
| `replacedByTokenId` / `replaced_by_token_id` | `text` NULL | Nachfolger in der Rotationskette (Audit) |
| `lastUsedAt` / `last_used_at` | `timestamptz` NULL | Beim Refresh aktualisiert |
| `createdAt` / `created_at` | `timestamptz` NOT NULL `defaultNow()` | Erstellzeit |

Indizes: `user_id`, `family_id`, `token_hash` (unique). `relations()`: `refreshTokens.userId → users`
(analog `sessions`). Barrel `server/database/schema/index.ts` + ggf. `relations.ts` ergänzen.

## Umsetzung (Feature-Anatomie)

Gemappt auf die 11-Schritt-Checkliste aus `_ARCHITECTURE.md`. Da dies **Auth-Infrastruktur ohne
Web-UI** ist, sind nur die Server-Schritte relevant; 6–11 (Client-API/Query-Keys/Composables/
Components/Index/Pages) entfallen bewusst — Konsument ist die externe App.

1. **Schema** — `server/database/schema/refresh-tokens.ts` (siehe Datenmodell) + Barrel/Relations;
   `pnpm db:generate` → `pnpm db:migrate`.
2. **ItemService** — *N/A*. Der Auth-Slice nutzt direkten Drizzle-Zugriff (wie `auth.service.ts`);
   die Refresh-Token-Logik (Hash-Lookup, Rotation, Familien-Widerruf) passt nicht auf generisches CRUD.
3. **Utilities + Feature-Service** —
   - `server/features/auth/access-token.utils.ts`: `signAccessToken(userId, familyId, secret)` →
     `{ token, expiresAt }` und `verifyAccessToken(token, secret)` → `{ userId, familyId } | null`.
     Struktur exakt wie `qr-token.utils.ts` (base64url, `createHmac('sha256', …)`, Namespace `at:v1:`,
     `timingSafeEqual`, `exp`-Check), TTL-Konstante `ACCESS_TOKEN_TTL_MS = 15 * 60_000`.
   - `server/features/auth/token-auth.service.ts` (`createTokenAuthService({ db, authService })`):
     - `issueTokenPair(userId, ctx?)` — neue `familyId` (ULID), Roh-Refresh-Token erzeugen, Hash +
       Zeile in `refresh_tokens` schreiben (userAgent/ipAddress/deviceName aus `ctx`), Access-Token
       signieren; gibt Roh-Refresh-Token + Access-Token + beide Ablaufzeiten zurück.
     - `rotate(rawRefreshToken, ctx?)` — Hash bilden, Zeile per `tokenHash` laden. Fehlt sie oder ist
       abgelaufen → 401. Ist `revokedAt` gesetzt → **Reuse**: gesamte `familyId` widerrufen, 401.
       Sonst: alte Zeile `revokedAt` setzen, neue Zeile in derselben Familie anlegen
       (`replacedByTokenId` verketten, `lastUsedAt` pflegen), neues Access-Token; Paar zurückgeben.
     - `revokeFamily(rawRefreshToken)` — Zeile laden, alle Zeilen der Familie `revokedAt` setzen;
       idempotent (unbekannter Token → `{ success: true }`, keine Enumeration).
     - `resolveAccessToken(token)` — `verifyAccessToken` → `{ userId, familyId }` oder `null`.
     - `listDevices(userId)` / `revokeDevice(userId, familyId)` / `revokeOtherDevices(userId, currentFamilyId)`
       — über nicht-widerrufene, nicht-abgelaufene Familien (jeweils neuester Token je Familie).
     - `cleanupExpiredRefreshTokens()` — löscht abgelaufene/lange widerrufene Zeilen (Rückgabe: Anzahl).
   - Refactor `server/features/auth/auth.service.ts`: `verifyCredentials(email, password)` aus `login`
     herauslösen (gibt `Omit<User,'passwordHash'|'searchVector'>` zurück oder wirft 401); `login` ruft
     es intern. `register` erhält Option `skipWebSession` (überspringt `createSession`), damit der
     Bearer-Register-Pfad **keine** verwaiste `sessions`-Zeile erzeugt.
4. **Wire Service** — `tokenAuthService` in `server/utils/container.ts` registrieren
   (`createTokenAuthService({ db, authService })`), Typ-Import + Getter analog bestehender Services.
5. **API-Routen** (dünn, delegierend; Zod v4 mit `.trim()`) —
   - `server/api/auth/token/index.post.ts` — Login: `verifyCredentials` → `issueTokenPair`.
   - `server/api/auth/token/register.post.ts` — `authService.register(..., { skipWebSession: true })`
     → `issueTokenPair` (Verifikations-Mail läuft wie im Web asynchron).
   - `server/api/auth/token/refresh.post.ts` — `rotate(refreshToken)`.
   - `server/api/auth/token/revoke.post.ts` — `revokeFamily(refreshToken)`.
   - `server/api/auth/devices/index.get.ts` — `requireAuth` → `listDevices(user.id)`
     (`isCurrent` = `familyId === event.context.tokenFamilyId`).
   - `server/api/auth/devices/[familyId].delete.ts` — `requireAuth` → `revokeDevice(user.id, familyId)`.
   - `server/api/auth/devices/revoke-others.post.ts` — `requireAuth` → `revokeOtherDevices(user.id, event.context.tokenFamilyId)`.
   - **Middleware** `server/middleware/auth.ts`: zuerst `Authorization: Bearer <token>` prüfen →
     `tokenAuthService.resolveAccessToken` → bei Erfolg Nutzer aus DB laden, `event.context.user`
     setzen, `event.context.tokenFamilyId = familyId`, `event.context.session` bleibt `null`, **kein**
     Sliding-Cookie. Ohne Bearer-Header: bestehender Cookie-Pfad **unverändert**.
     `event.context.tokenFamilyId` in `server/types` (H3-Context-Augmentation) ergänzen.
   - `server/api/admin/tasks/cleanup.post.ts` um `cleanupExpiredRefreshTokens()` erweitern.

6–11. **Client-API / Query-Keys / Composables / Components / Index / Pages** — *N/A* (externe App).

## Technische Hinweise

- **Auth-Guards:** `requireAuth`/`requireEmailVerified` (`server/features/auth/auth.guard.ts`) lesen
  `event.context.user` und funktionieren dadurch **transparent** für Bearer- und Cookie-Requests —
  keine Änderung nötig.
- **Kein DB-Hit für die Token-Signatur, aber User frisch aus DB:** Der Bearer-Pfad verifiziert das
  Access-Token stateless (HMAC), lädt den Nutzer aber pro Request aus `users` (analog `validateSession`,
  aber ohne `sessions`-Join), damit Rollenänderungen/Sperren sofort wirken. `passwordHash`/`searchVector`
  niemals ausliefern (bestehendes `omitPasswordHash`-Muster).
- **Secret-Wiederverwendung:** `signAccessToken`/`verifyAccessToken` nutzen `config.security.auth_secret`
  wie `signQrToken`; eigener Namespace-Prefix `at:v1:` verhindert Token-Verwechslung mit dem QR-Namespace.
- **Refresh-Token nie im Klartext persistieren:** nur SHA-256-Hash in `token_hash`; Lookup über den Hash
  des vorgelegten Tokens. Konstant-Zeit-Vergleich ist durch den Unique-Hash-Lookup entbehrlich.
- **Reuse-Detection = Diebstahlsignal:** Ein erneut vorgelegter, bereits rotierter Token sperrt die
  ganze Familie — dokumentiert das erwartete Sicherheitsverhalten, nicht bloß einen Fehlerfall.
- **Rate-Limiting** (`nuxt.config.ts` → `routeRules`, `nuxt-security`): `/api/auth/token` wie
  `/api/auth/login` (10 / 5 min), `/api/auth/token/register` wie `/api/auth/register` (5 / 10 min),
  `/api/auth/token/refresh` moderat (z.B. 30 / 5 min), `/api/auth/token/revoke` lax.
- **Zod v4** mit `.trim()` für alle String-Eingaben; Login-/Register-Schemata von den bestehenden
  Web-Endpoints spiegeln (gleiche Regeln, u.a. `USERNAME_PATTERN`).
- **Fehlerformate** über `createError` (401 bei ungültigen Credentials/Token, 409 bei
  Email/Username-Kollision) — konsistent mit den Web-Auth-Endpoints.

**Anti-Patterns vermeiden** (`_ARCHITECTURE.md`):
- Keine Business-Logik in API-Routen — Rotation/Reuse/Signatur leben im `token-auth.service`.
- Keine direkten DB-Queries in Routen — nur über `token-auth.service`/`auth.service`.
- Keine Session-Validierung in jeder Route — zentral in `server/middleware/auth.ts` + Guards.
- Keine Cross-Feature-Imports am Barrel vorbei; Client-/Server-Typen nur über `shared/`.
- Kein Duplizieren der Credential-/Register-Logik — `verifyCredentials` extrahieren und wiederverwenden.

## Erfolgskriterien

- `POST /api/auth/token` mit gültigen Credentials liefert `{ user, accessToken, refreshToken,
  accessTokenExpiresAt, refreshTokenExpiresAt }` und legt **keine** `sessions`-Zeile an.
- Ein geschützter Endpoint (z.B. `GET /api/auth/session`, `GET /api/me/permissions`) akzeptiert
  `Authorization: Bearer <accessToken>` und liefert denselben Nutzer wie via Cookie.
- Der **Web-Cookie-Flow bleibt unverändert** (Login/Session/Logout im Browser funktionieren wie zuvor).
- Nach Ablauf des Access-Tokens (>15 Min) → 401; `POST /api/auth/token/refresh` liefert ein neues Paar,
  der zuvor benutzte Refresh-Token ist danach ungültig (Rotation).
- Erneutes Vorlegen eines bereits rotierten Refresh-Tokens → 401 **und** alle Tokens derselben Familie
  sind widerrufen (weitere Refreshes/Logins dieser Familie scheitern).
- `POST /api/auth/token/revoke` macht die Familie tot; ein anschließender Refresh scheitert (401).
- `GET /api/auth/devices` listet aktive Familien mit `deviceName`/`userAgent`/`ipAddress`/Zeiten und
  markiert das aktuelle Gerät (`isCurrent`); `DELETE /api/auth/devices/:familyId` und
  `revoke-others` widerrufen zielgerichtet.
- In `refresh_tokens` steht **kein** Roh-Token, nur `token_hash`.
- `pnpm lint` und `pnpm typecheck` sind grün; `cleanupExpiredRefreshTokens()` entfernt abgelaufene Zeilen.
