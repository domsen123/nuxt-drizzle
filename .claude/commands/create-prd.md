---
description: Interaktiver PRD-Generator — stellt Klärungsfragen und schreibt ein architektur-konformes PRD nach prd/<bereich>/<name>.md
argument-hint: [kurze Feature-Beschreibung]
---

# PRD erstellen

## Kontext (automatisch eingebettet)

- Arbeitsverzeichnis: !`pwd`
- Bestehende PRDs: !`find prd -type f 2>/dev/null | sort`
- Vorhandene Client-Features: !`ls app/features 2>/dev/null`
- Vorhandene Server-Features: !`ls server/features 2>/dev/null`
- Letzte Commits: !`git log --oneline -5`

## Deine Aufgabe

$ARGUMENTS

Du bist ein PRD-Generator für **dieses** Repository (Nuxt 4 SaaS, **Vertical Slice Architecture**,
ItemService/DI, Pinia Colada, Drizzle, Zod v4, Self-Auth). Erstelle gemeinsam mit dem Nutzer ein
detailliertes Product Requirements Document (PRD) auf Deutsch, im **Haus-Stil** der bestehenden PRDs.

Das Ziel-PRD ist so klar und explizit, dass ein **Junior-Entwickler** es ohne Rückfragen umsetzen
kann. Beschreibe das *Was* und *Warum*, nicht jede *Wie*-Codezeile — aber verankere es an der realen
Architektur und an echten Dateipfaden dieses Repos.

> Wichtig: **Implementiere das Feature NICHT.** Dieser Command erzeugt ausschließlich das PRD-Dokument.

> **Grundregel — keine offenen Entscheidungen:** Das fertige PRD enthält **keine** offenen,
> unentschiedenen oder optionalen Designpunkte und **keine** Platzhalter wie „optional",
> „nice-to-have", „TBD", „ggf. später", „könnte man auch …" oder „Entscheidung offen". Jeder Punkt
> ist eine **finale Entscheidung**. Sobald beim Erstellen eine offene Frage oder eine Wahlmöglichkeit
> auftaucht, **entscheidest du das NICHT selbst** — du fragst den Nutzer (Format aus Phase 2) und
> wartest auf seine Antwort. Frage so lange in Runden nach, bis **nichts** mehr offen ist. Erst dann
> schreibst du das PRD. (Out-of-Scope-Punkte sind erlaubt — sie sind eine bewusste, finale
> Entscheidung, etwas *nicht* zu tun, nicht ein offener Punkt.)

Arbeite strikt in dieser Reihenfolge:

### Phase 1 — Codebase zur Laufzeit verstehen (VOR den Fragen)

Bevor du irgendetwas fragst, verschaffe dir echtes Kontextwissen — verlasse dich nicht auf Annahmen:

1. Lies `_ARCHITECTURE.md` vollständig. Präge dir besonders die **Feature-Checkliste** (die 11
   Schritte) und die **Anti-Patterns to Avoid** ein — beide werden im PRD referenziert.
2. Lies die relevanten Konventionen aus `CLAUDE.md` (Aliase `~/`, `~~server/`, `~~shared/`;
   Arrow Functions; Zod v4 mit `.trim()`; Drizzle-Workflow `pnpm db:generate` → `pnpm db:migrate`).
3. Lies **eine** bestehende PRD als Stil- und Strukturvorlage:
   `prd/organisations/vereine-shops-foundation.md` (bei Bedarf zusätzlich
   `prd/social/follows-profiles-and-search.md`).
4. Scanne die zum gewünschten Feature **thematisch passende(n)** bestehende(n) Slice(s), um echte
   Pfade/Muster zu referenzieren und vorhandene Bausteine **wiederzuverwenden** statt neu zu erfinden:
   - `app/features/<name>/` (Struktur: `api/<name>.api.ts`, `api/<name>.keys.ts`, `composables/`,
     `components/`, `types/`, `index.ts`)
   - `server/features/<name>/` (`<name>.service.ts`, `<name>.types.ts`)
   - `server/database/schema/*` (ULID-`text`-id, Indizes, `relations()`)
   - `server/utils/container.ts` (DI-Composition-Root, ItemService-Registrierung)
   - `server/api/<name>/` (dünne Handler, `requireAuth` / `requirePermission`)
   - `app/utils/routes.ts` (Routen-Konstanten)

Nenne im weiteren Verlauf konkrete, **existierende** Dateipfade und Utilities (z. B. `requireAuth`,
`requirePermission`, ItemService-Filteroperatoren, Query-Key-Factories), wo sie wiederverwendet
werden können.

5. **Pencil-Screens holen.** Inspiziere das Pencil-Design über die `pencil`-MCP-Tools und finde die
   zum Feature gehörenden Screens. Vorgehen:
   - `get_editor_state(include_schema: true)` zuerst (Schema nötig für alle weiteren Calls).
   - Passende Screens/Frames identifizieren; je Screen `snapshot_layout` + `get_screenshot` ziehen,
     bei Bedarf `batch_get` für Details und `get_variables` für Brand-Tokens.
   - Notiere je Screen den **Namen/ID** und kurz, welchen Feature-Flow er abdeckt.
   - Falls **kein** passender Screen existiert, halte das fest und frage in Phase 2, ob das Design
     noch fehlt (dann referenziert das PRD keinen Screen und die Frontend-Sektion entfällt).
   `.pen`-Dateien nur über `pencil`-Tools lesen, nie via Read/Grep.

### Phase 2 — Klärungsfragen stellen (3–5, nur das Wesentliche)

Stelle **ausschließlich** die kritischsten Fragen, deren Antwort sich nicht vernünftig aus dem
Prompt und dem Codebase-Kontext ableiten lässt. Maximal 3–5 Fragen.

Formatregeln (für einfache Antworten wie „1A, 2C, 3B"):
- **Nummeriere** alle Fragen (1, 2, 3, …).
- Liste die Optionen je Frage als **A, B, C, D**.

Decke typische Lücken ab — und **architektur-spezifische** Entscheidungen, die das PRD prägen:
- **Problem/Ziel:** Welches Nutzerproblem löst das Feature?
- **Kernfunktionalität:** Welche zentralen Aktionen muss der Nutzer ausführen können?
- **Scope-Grenzen:** Was soll das Feature ausdrücklich *nicht* tun?
- **Erfolgskriterien:** Woran erkennen wir, dass es erfolgreich umgesetzt ist?
- **Zugriff/Auth:** öffentlich · auth-geschützt (`requireAuth`) · permission-basiert
  (`requirePermission`, Scope global vs. per-Org)?
- **Datenmodell:** neue Drizzle-Tabelle(n) anlegen oder bestehende erweitern? Relationen?
- **Verortung:** gehört die Logik in eine eigene Feature-Slice oder nach `shared/`?

Beispiel-Format:

```
1. Was ist das primäre Ziel dieses Features?
   A. …
   B. …
   C. …

2. Wer ist die Zielgruppe?
   A. Alle Nutzer
   B. Nur eingeloggte Nutzer
   C. Nur Organisations-Admins
```

**Stelle die Fragen und WARTE auf die Antwort des Nutzers.** Generiere das PRD erst danach.

**Iteriere bis nichts mehr offen ist:** Prüfe nach den Antworten, ob noch irgendein Punkt offen,
unentschieden oder „optional" wäre (auch solche, die dir erst beim Durchdenken des Datenmodells, der
Routen oder des Auth-Modells auffallen). Falls ja, stelle eine weitere kurze Frage-Runde im selben
Format und warte erneut. Beginne mit Phase 3 **erst**, wenn jede Designentscheidung final getroffen
ist — gemäß der Grundregel oben.

### Phase 3 — PRD im Haus-Stil generieren

Nutze die Antworten und den Codebase-Kontext. Erzeuge das Dokument exakt mit dieser Struktur
(deutschsprachig, Tabellen wo sinnvoll):

- `# PRD: <Titel>`
- `> Status: geplant · Scope: <ein bis zwei Zeilen Kurzfassung mit den zentralen Routen/Flächen>`
- `## Context` — das **Warum**: Problem, Auslöser, angestrebtes Ergebnis; was es bewusst *nicht*
  ist. Verweise auf bereits Vorhandenes im Repo, das wiederverwendet wird.
- `## Produktentscheidungen (final)` — Entscheidungstabelle `| Thema | Entscheidung |` mit allen
  in Phase 2 getroffenen und allen ableitbaren Festlegungen.
- `## Scope` — **In Scope** / **Out of Scope** als Listen (Out of Scope managt Erwartungen).
- `## Pencil-Screens` — Tabelle `| Screen (Name/ID) | Feature-Flow | Ziel-Page/Component |` mit den
  in Phase 1 identifizierten Screens. Trage hier **alle** zum Feature gehörenden Pencil-Frames
  (Name/ID) ein, die du in Phase 1 inspiziert hast — vollständig, denn diese Sektion ist die einzige
  Design-Referenz im PRD. Diese Screens sind die **verbindliche Design-Vorlage** für die spätere
  Frontend-Umsetzung.
- `## Frontend-Umsetzung (Handoff)` — kurze Sektion, die dem **späteren** PRD-Implementierungs-Agenten
  sagt, wie die UI gebaut wird. Wörtlich festhalten: *Die Frontend-/Design-Umsetzung erfolgt durch den
  Agenten `pencil-nuxt-implementer`. Er wird **erst nach** der Backend-Umsetzung (Schema, Service, API,
  DI aus `## Umsetzung`) gestartet und baut die UI ausschließlich anhand der Frames aus
  `## Pencil-Screens` sowie der Ziel-Pages/Components aus `## Umsetzung` (Schritte 9 + 11).* Der Agent
  liest das Pencil-Design nur und verändert es nie. Falls in Phase 1 kein Screen gefunden wurde, notiere
  hier stattdessen, dass das Design in Pencil noch fehlt und die UI daher noch nicht umgesetzt werden kann.
- `## Datenmodell` — neue/erweiterte Tabellen + Spalten. Konventionen: ULID-`id` (`text`),
  `snake_case` (DB) / `camelCase` (TS), `createdAt`/`updatedAt` mit Timezone, nötige Indizes,
  Relationen via `relations()`. Drizzle-Workflow: `pnpm db:generate` → `pnpm db:migrate`.
- `## Umsetzung (Feature-Anatomie)` — die konkreten Bausteine, **gemappt auf die 11-Schritt-
  Checkliste** aus `_ARCHITECTURE.md`, mit echten Alias-Pfaden:
  1. Schema in `server/database/schema/<name>.ts`
  2. ItemService-Instanz in `server/utils/container.ts`
  3. Feature-Service in `server/features/<name>/<name>.service.ts`
  4. Service im Container verdrahten
  5. API-Routen in `server/api/<name>/` (dünn, delegierend; `requireAuth`/`requirePermission`)
  6. Client-API in `app/features/<name>/api/<name>.api.ts`
  7. Query-Key-Factory in `app/features/<name>/api/<name>.keys.ts`
  8. Composables (`useQuery`/`useMutation`) in `app/features/<name>/composables/`
  9. Components in `app/features/<name>/components/`
  10. Barrel-Export `app/features/<name>/index.ts`
  11. Pages in `app/pages/` + Routen-Konstanten in `app/utils/routes.ts`
- `## Technische Hinweise` — ItemService-Filteroperatoren (`_eq`, `_in`, `_ilike`, …); Pinia-Colada
  `useQuery`/`useMutation` inkl. **Cache-Invalidierung** (nach Create → Listen invalidieren; nach
  Update → Listen + Detail; nach Delete → Listen invalidieren + Detail clearen); Zod-v4-Validierung
  mit `.trim()`; Auth (`requireAuth`/Guard + Middleware `server/middleware/auth.ts`); ggf. Event-Bus.
  Schließe mit **„Anti-Patterns vermeiden"** (Liste aus `_ARCHITECTURE.md`, u. a.: keine Business-
  Logik in API-Routen, keine direkten DB-Queries in Routen, keine Cross-Feature-Imports am `index.ts`
  vorbei, keine hartkodierten Query-Keys, keine fehlende Cache-Invalidierung nach Mutationen).
- `## Erfolgskriterien` — messbare, überprüfbare Kriterien.

> Es gibt **keine** `## Offene Fragen`-Sektion. Alles, was sonst dort landen würde, muss vorab in
> Phase 2 geklärt und als finale Entscheidung in `## Produktentscheidungen (final)` festgehalten
> werden.

### Phase 4 — Speichern

Speichere das PRD als `prd/<bereich>/<feature-name>.md`:
- `<bereich>`: bestehenden Themen-Ordner unter `prd/` wiederverwenden, falls er passt; sonst einen
  neuen, sprechenden Ordner anlegen.
- `<feature-name>`: kebab-case, sprechend (Stil wie `vereine-shops-foundation`,
  `follows-profiles-and-search`).
- Kündige den finalen Zielpfad an.

### Phase 5 — Abschluss (KEINE Umsetzung starten)

Dieser Command endet mit dem gespeicherten PRD. Du startest **keinen** Agenten und implementierst
**weder Backend noch Frontend**.

- **Starte `pencil-nuxt-implementer` NICHT.** Die Frontend-Umsetzung ist im PRD unter
  `## Frontend-Umsetzung (Handoff)` dokumentiert und wird **erst später** ausgelöst — durch den
  Agenten, der das PRD umsetzt (z. B. via „starte bitte Implementierung des PRDs xyz"). Dieser
  Implementierungs-Agent baut zuerst das Backend und startet **danach** `pencil-nuxt-implementer`
  für die UI.
- Nenne dem Nutzer zum Abschluss den Zielpfad des PRD und weise darauf hin, dass die Umsetzung als
  separater Schritt gestartet wird.

## Abschluss-Anweisungen

1. Implementiere **nichts** selbst — dieser Command erzeugt ausschließlich das PRD-Dokument. Weder
   Backend noch Frontend werden hier umgesetzt, und **kein** Agent wird gestartet.
2. Stelle in jedem Fall zuerst die Klärungsfragen und warte auf die Antwort.
3. Verfeinere das PRD anhand der Nutzerantworten.
4. Triff offene oder optionale Entscheidungen **nie** selbst — frage nach und warte. Das fertige PRD
   enthält ausschließlich finale Entscheidungen.
5. Hole in Phase 1 immer die passenden Pencil-Screens und trage sie im PRD vollständig ein
   (`## Pencil-Screens`) plus die `## Frontend-Umsetzung (Handoff)`-Sektion. Nur wenn kein Screen
   existiert, entfällt die Frontend-Sektion.
