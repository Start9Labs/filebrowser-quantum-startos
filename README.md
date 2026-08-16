<p align="center">
  <img src="icon.svg" alt="FileBrowser Quantum Logo" width="21%">
</p>

# FileBrowser Quantum on StartOS

> Everything not listed in this document should behave the same as upstream
> FileBrowser Quantum. If a feature, setting, or behavior is not mentioned
> here, the upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

FileBrowser Quantum is a maintained fork of [File Browser](https://github.com/filebrowser/filebrowser), adding an indexed search, richer previews, per-folder access control and WebDAV. Upstream: <https://github.com/gtsteffaniak/filebrowser>.

---

## Table of Contents

- [Package Identity and Flavor](#package-identity-and-flavor)
- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Package Identity and Flavor

This package shares the `filebrowser` package id with `filebrowser-startos`, and distinguishes itself with the ExVer flavor `#quantum`. The two therefore appear in the marketplace as one listing with a flavor picker, and the install button reads **Switch** rather than Install when the other flavor is present. This is the same arrangement Bitcoin Core and Bitcoin Knots use under the `bitcoind` id. Note StartOS offers that button in both directions regardless of the migration graph, so the reverse switch is presented and then refused at install time.

Flavored and unflavored versions are _incomparable_, not ordered — `ExtendedVersion::partial_cmp` returns `None` across flavors. Two consequences follow, and both are deliberate:

- Quantum never appears on the Updates page for a File Browser install. The switch is something the user chooses, which is correct here because it widens permissions on restricted accounts (see Limitations).
- A flavored version satisfies none of the dependents' unflavored version ranges on its own. `.satisfies('2.63.23:0')` on the current version declares an alias that does, so the eight packages that depend on `filebrowser` need no changes.

The sidegrade edge lives in `migrations.other` under the `^2` key. Without it the flavor would be an island: `canMigrateFrom` would not cover the 2.x line, and StartOS would reject the switch as an unsatisfiable range rather than running it as an update.

There is deliberately no matching `down`. File Browser is end of life, so the switch is one-way: `canMigrateTo` is `<=#quantum:1.5.2:0`, leaving no version of the unflavored line reachable. Omitting the function is how a sidegrade edge expresses that — `migrations.other` accepts no `IMPOSSIBLE`.

## Image and Container Runtime

One prebuilt upstream image, run in a single subcontainer named `filebrowser-sub`.

|                |                      |
| -------------- | -------------------- |
| Image id       | `filebrowser`        |
| Upstream image | `gtstef/filebrowser` |
| Architectures  | `x86_64`, `aarch64`  |
| Subcontainer   | `filebrowser-sub`    |
| Runs as        | uid 1000             |

The upstream Docker namespace is `gtstef`, not `gtsteffaniak` — `hub.docker.com/v2/repositories/gtsteffaniak/filebrowser` is a 404. GHCR mirrors the same digests under the full name.

`FILEBROWSER_DISABLE_AUTOMATIC_BACKUP` is set. Quantum otherwise copies the database to `.bak` during conversion, but takes that copy _inside_ the per-user loop, so on a multi-user database the final `.bak` already holds partly-converted users under a name that implies otherwise.

## Volume and Data Layout

Four volumes. The first three are inherited from `filebrowser-startos` and must keep their ids and mountpoints, because a switch reuses them in place.

| Volume     | Mount       | Contents                                                                |
| ---------- | ----------- | ----------------------------------------------------------------------- |
| `data`     | `/srv`      | The user's files. **Eight sibling packages mount this volume by name.** |
| `database` | `/database` | `filebrowser.db`                                                        |
| `config`   | `/config`   | Generated `config.yaml` and the package store                           |
| `cache`    | `/cache`    | Search index, thumbnails, generated icons                               |

`cache` is new relative to File Browser. `server.cacheDir` defaults to the relative string `tmp`, which resolves against the process working directory and would land the search index on ephemeral storage, rebuilding it on every restart. It must be set to an absolute path on a real volume.

Quantum writes nothing into `/srv` — verified by diffing the tree across a full run including indexing. That matters because the volume is shared with other packages.

## File Models

| Model            | Path                   | Purpose                                            |
| ---------------- | ---------------------- | -------------------------------------------------- |
| `config.yaml.ts` | `/config/config.yaml`  | The upstream config file                           |
| `store.json.ts`  | `/config/startos.json` | Package state — whether an admin credential exists |

Every field in `config.yaml` is a `z.literal`: the file is fully package-owned and there is nothing in it for the user to choose. Notably it contains **no `auth` block**. Setting `auth.adminPassword` makes Quantum reset that user's password on _every_ start, which would both destroy a migrated password and prevent the user from ever changing their own.

## Dependencies

None.

## Network Access and Interfaces

| Interface | Type | Port |
| --------- | ---- | ---- |
| `ui`      | ui   | 80   |

Port 80, not File Browser's 8080 — that is Quantum's default and the package follows it. WebDAV is served on the same port under `/dav`.

## Installation and First-Run Flow

**Switching from File Browser.** The `^2` up-migration carries over the configured session timeout and marks the admin credential as already present. Quantum converts the database in place on first start. Users, password hashes and the admin flag all survive; the user signs in with the credentials they already had, and no task is raised.

**Fresh install.** No migration runs, so the store is empty and a `critical` task blocks startup until the user runs **Set Admin Password**. This also forecloses upstream's `quickSetup`, which would otherwise create an admin whose password is literally `admin`.

## Actions

| Action               | When to run                                              | Effect                                                                  |
| -------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `set-admin-password` | At install on a fresh setup, or to rotate the credential | Generates a password and applies it with the upstream CLI. Repeat-safe. |

Only available while stopped: Quantum holds an exclusive lock on the database while running, and the CLI reports `the database is locked` against a live server. The action runs the CLI in a temporary subcontainer, so the password is never written to package state.

## Tasks

| Task                 | Severity | Raised when                                                            |
| -------------------- | -------- | ---------------------------------------------------------------------- |
| `set-admin-password` | critical | The store has no admin credential — i.e. a fresh install, not a switch |

## Health Checks

The `primary` daemon's `ready` check requests `GET /health` and expects 200. The endpoint is registered on both the authenticated and public routers, so it needs no credentials. It reflects "HTTP server up" rather than "indexing finished".

## Backups and Restore

`data`, `database` and `config` are backed up by direct volume sync. `cache` is excluded — the search index, thumbnails and generated icons are all rebuilt on demand.

The conversion is one-way and destructive: File Browser cannot read the database once Quantum has rewritten it, and the package keeps no private copy of the original. A StartOS backup taken before switching is the only recovery path, which is why both the release notes and the File Browser end-of-life notice tell the user to take one first.

## Limitations and Differences

- **Per-user folder restrictions do not survive the switch.** File Browser stored a single `scope` string per user; Quantum reads a `scopes[]` list, finds it absent, and assigns the source's default of `/`. An account confined to a subfolder can afterwards list the entire shared volume. Every restricted account must be re-checked after switching. This is upstream behavior, reproduced and verified.
- **Existing share links break.** The records migrate and the hashes still resolve, but the content 404s because File Browser shares carry no source name, and they do not appear in the admin share list, so they cannot be cleaned up from the UI.
- **Access rules do not carry over.** Upstream documents this as intended; they must be recreated.
- **Shell commands and runners are gone.** Upstream removed them deliberately and says they will not return.
- **The switch is one-way.** File Browser is end of life, so no `down` edge is published and StartOS refuses an install of the unflavored line over this one. The refusal is clean — it happens before any data is touched and the service is rolled back — but the only way to run File Browser again is to restore a backup taken before switching.
- The 2.x line is beta and not packaged. It replaces BoltDB with SQLite and its migration path silently strips the admin flag from a File Browser database; upstream recommends 1.5.x for production.

## Troubleshooting

**Startup fails with `cacheDir failed to create test file: permission denied`.** The `cache` volume is not owned by uid 1000. Quantum writes and fsyncs a 10 MB probe file into `cacheDir` on every start and treats any I/O error there as fatal. The `chown` oneshot covers it; check its log line.

**Startup fails with `could not open database: permission denied`.** Same cause on the `database` volume. Note the File Browser database ships mode `0640`, so world-readable is not enough — it genuinely needs the uid.

**Browsing works but every write returns 403.** `/srv` is still root-owned. Same oneshot.

**A user who was restricted to one folder can now see everything.** Expected — see Limitations.

To inspect the running container: `start-cli package attach filebrowser -n filebrowser-sub -- <cmd>`.

## Contributing

Build and development workflow follow the StartOS packaging guide: <https://docs.start9.com/packaging>. Keep `README.md`, `instructions.md`, and `AGENTS.md` in sync with any change to user-visible behavior or package structure.

---

## Quick Reference for AI Consumers

```yaml
package_id: filebrowser
flavor: quantum
image: gtstef/filebrowser
architectures: [x86_64, aarch64]
subcontainers: [filebrowser-sub]
volumes:
  data: /srv
  database: /database
  config: /config
  cache: /cache
file_models:
  - /config/config.yaml
  - /config/startos.json
startos_managed_env_vars:
  - FILEBROWSER_DISABLE_AUTOMATIC_BACKUP
dependencies: none
interfaces:
  ui: { type: ui, port: 80 }
actions:
  - set-admin-password
  - set-expiration
tasks:
  - { action: set-admin-password, severity: critical }
health_checks:
  - primary
```
