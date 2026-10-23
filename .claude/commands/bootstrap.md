---
allowed-tools: Bash(git:*), Bash(gh:*), Bash(pnpm:*), Bash(ss:*), Bash(docker ps:*), Bash(openssl:*), Bash(node:*), Bash(basename:*), Bash(rm -rf .git), Bash(rm -rf prd/*), Bash(touch:*), Bash(cp:*), Bash(sed:*), Bash(test:*), Bash(ls:*), Read, Edit, Write
argument-hint: [repo-name] [--public]
description: Bootstrap a fresh project from this template (version 0.0.0, free postgres port, .env, new git repo on GitHub, release v0.0.1)
---

## Context

- Directory: !`pwd`
- Directory name: !`basename "$PWD"`
- package.json name/version: !`node -p "const p=require('./package.json'); p.name + '@' + p.version"`
- Existing env files: !`ls -a | grep -E '^\.env' || true`
- Current git remote: !`git remote -v 2>/dev/null || echo "no git repo"`
- GitHub auth: !`gh auth status 2>&1 | head -3`
- Listening TCP ports: !`ss -ltnH 2>/dev/null | awk '{print $4}' | sed 's/.*://' | sort -un | tr '\n' ' '`
- Docker-mapped ports: !`docker ps -a --format '{{.Ports}}' 2>/dev/null | grep -oE ':[0-9]+->' | tr -d ':->' | sort -un | tr '\n' ' '`

## Your Task

Turn this template checkout into a brand new project. Arguments: `$ARGUMENTS`

- **Repo name**: first argument, otherwise the directory name. Must be a valid GitHub repo name (lowercase, kebab-case).
- **Visibility**: `--private` by default, `--public` if passed.

### 0. Confirm first

This step deletes the existing git history. Before touching anything, show the user a short summary (repo name, visibility, chosen ports, package name) and **ask for confirmation**. Abort if `gh auth status` is not logged in. If the current remote still points at the template repo, mention that the history will be removed but the template on GitHub stays untouched.

### 1. package.json

- Set `"version"` to `"0.0.0"`.
- Set `"name"` to the repo name.
- Reset `CHANGELOG.md` to just `# Changelog\n` (the template's history doesn't belong to the new project).
- In the `docker:test:up` and `docker:test:down` scripts, replace the compose project name `-p cockpit-test` with `-p <repo-name>-test`.

### 1b. Test container

In `docker-compose.test.yml`, set `container_name` of `postgres-test` to `<repo-name>-postgres-test`, so test databases of several projects can run side by side.

Docker Compose project names (`-p`) only allow lowercase letters, digits, `-` and `_`: if the repo name contains dots, replace them with `-` for the `-p` value.

### 1c. PRDs

The template's PRDs belong to the template. Delete everything inside `prd/` (`rm -rf prd/*`) and add an empty `prd/.gitkeep` so the folder survives for `/create-prd`.

### 2. Find free postgres ports

A port is free when it is neither in the listening ports nor in the docker-mapped ports above (stopped containers still claim their port when they start again).

- **Dev DB**: start at `5432`, increment until free.
- **Test DB**: start at the dev port + 1 (or `5460` if that is lower), increment until free and different from the dev port.

Double-check the final choices with `ss -ltnH "sport = :<port>"` (empty output = free).

### 3. Create `.env` and `.env.test`

Only create a file if it doesn't exist yet; if it exists, only update the values below and tell the user.

`.env` from `.env.example`:
- `NUXT_DATABASE_PORT` = dev port
- `NUXT_DATABASE_NAME` = repo name
- `NUXT_SITE_NAME` = repo name in Title Case
- `NUXT_AUTH_SECRET` = `openssl rand -base64 48`
- `NUXT_APP_SECRET` = `openssl rand -base64 48` (separate value)

`.env.test` from `.env.test.example`:
- `NUXT_DATABASE_PORT` = test port
- `NUXT_DATABASE_NAME` = `<repo-name>-test`
- generate any empty secrets the same way

Never print the generated secrets in your output.

### 4. Fresh git repository

```bash
rm -rf .git
git init -b main
git add -A
git commit -m "feat: starting something new"
```

Check `git status` before committing: `.env` / `.env.test` must NOT be staged (they are gitignored — verify).

### 5. GitHub repo

```bash
gh repo create <repo-name> --private|--public --source=. --remote=origin --push
```

### 6. Release v0.0.1

```bash
pnpm release --patch
```

`changelogen --release --push` bumps 0.0.0 → 0.0.1, writes the changelog, commits `chore(release): v0.0.1`, tags `v0.0.1` and pushes. Verify afterwards with `git log --oneline -3` and `git tag`.

### 7. Report

Summarize: repo URL (`gh repo view --json url -q .url`), dev/test postgres ports, and next steps:

```bash
pnpm install
pnpm docker:up
pnpm db:migrate
pnpm dev
```

If any step fails, stop and report exactly which step failed and what state the project is in — don't try to continue past a failed `gh repo create` or release.
