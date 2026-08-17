<p align="center">
  <img src="icon.svg" alt="FileBrowser Quantum Logo" width="21%">
</p>

# FileBrowser Quantum on StartOS

> Everything not listed in this document should behave the same as upstream
> FileBrowser Quantum. If a feature, setting, or behavior is not mentioned
> here, the upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

[FileBrowser Quantum](https://github.com/gtsteffaniak/filebrowser) is a maintained fork of [File Browser](https://github.com/filebrowser/filebrowser), adding an indexed search, richer previews, per-folder access control and WebDAV. It is packaged as the **`#quantum` flavor of the `filebrowser` package id**, so it and `filebrowser-startos` are one marketplace listing with a flavor picker — the same arrangement Bitcoin Core and Bitcoin Knots use under `bitcoind` — and installing it over File Browser converts that install in place rather than starting a new one.

- **Upstream repo:** <https://github.com/gtsteffaniak/filebrowser>
- **Wrapper repo:** <https://github.com/Start9Labs/filebrowser-quantum-startos>

---

## Table of Contents

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
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

The upstream image is used unmodified, with its own entrypoint, and one subcontainer runs the service.

| Property      | Value                                                                |
| ------------- | -------------------------------------------------------------------- |
| Image         | `gtstef/filebrowser`                                                 |
| Architectures | x86_64, aarch64                                                      |
| Entrypoint    | Upstream default                                                     |
| Runs as       | uid 1000                                                             |
| Subcontainer  | `filebrowser-sub` — the `primary` daemon, and the one to `attach` to |

The Docker namespace is `gtstef`, not `gtsteffaniak`; the full name resolves only on GHCR, which mirrors the same digests.

A `chown` oneshot runs as root before the daemon on every start, handing all four volumes to uid 1000. The Set Admin Password action uses its own short-lived subcontainer, `setadmin`, and repeats the same `chown` there because on a fresh install the daemon's oneshot has not run yet.

One StartOS-managed environment variable is set: `FILEBROWSER_DISABLE_AUTOMATIC_BACKUP`. Quantum otherwise copies the database to `.bak` during conversion, but takes that copy _inside_ the per-user loop, so on a multi-user database the final `.bak` holds partly-converted users under a name that implies otherwise.

## Volume and Data Layout

Four volumes. The first three are inherited from `filebrowser-startos` and keep their ids and mount points, because a switch reuses them in place.

| Volume     | Mount Point | Purpose                                                                    |
| ---------- | ----------- | -------------------------------------------------------------------------- |
| `data`     | `/srv`      | The user's files — sibling packages mount this volume by name as a library |
| `database` | `/database` | `filebrowser.db`, the users, shares and access rules                       |
| `config`   | `/config`   | The generated `config.yaml` and the package store                          |
| `cache`    | `/cache`    | The search index, thumbnails and generated icons                           |

`cache` is new relative to File Browser and is not optional. `server.cacheDir` defaults to the relative string `tmp`, which resolves against the process working directory and would put the search index on ephemeral storage, rebuilding it on every restart with nothing to indicate it. It must be an absolute path on a real volume, which is what the model enforces.

Quantum writes nothing into `/srv` — verified by diffing the tree across a full run including indexing. That matters because the volume is shared with other packages.

Every volume must be owned by uid 1000, which the `chown` oneshot guarantees. Quantum writes and fsyncs a 10 MB probe file into `cacheDir` on every start and treats any I/O error there as fatal, and the database ships mode `0640`, so world-readable is not sufficient.

## File Models

Two models. One is the upstream config file, almost entirely package-owned; the other is StartOS-side state.

| File           | Format | Modelled                | Written by                                            |
| -------------- | ------ | ----------------------- | ----------------------------------------------------- |
| `config.yaml`  | YAML   | Yes — `FileHelper.yaml` | Every init, the switch migration, Set Session Timeout |
| `startos.json` | JSON   | Yes — `FileHelper.json` | Install, the switch migration, Set Admin Password     |

**Enforced** in `config.yaml` — every key is a `z.literal` and is rewritten on any package write: the port, the database path, `cacheDir`, the served source at `/srv`, logging, and `disableUpdateCheck`, which is on here and off upstream because StartOS owns updates.

**Yours:** `auth.tokenExpirationHours`, through Set Session Timeout. It is the only key the package may ever write under `auth`. A non-empty `auth.adminPassword` makes Quantum reset that user's password on _every_ start, which would both destroy a password carried over from File Browser and stop the user from ever setting their own — so the field is not emitted at all, and the admin credential is applied through the upstream CLI instead.

`startos.json` holds one flag, `adminInitialized`. It is set by Set Admin Password and by the switch migration — a converted File Browser database already carries working credentials — and it is what the install task tests. Clearing it by hand re-raises that task.

Everything else about Quantum — users, permissions, shares, access rules, branding — lives in its database rather than in a file, and is configured inside the application.

## Dependencies

None. Other services depend on this package instead, mounting its `data` volume as a read-only library.

Those dependents declare unflavored version ranges, which a flavored version satisfies on its own for none of them; the package therefore declares an unflavored alias so their ranges keep resolving across the switch, and they need no changes.

## Network Access and Interfaces

One interface. Nothing is exported for dependent services — a dependent reaches the files through a volume mount instead.

| Interface | Id   | Type | Port | Description                                   |
| --------- | ---- | ---- | ---- | --------------------------------------------- |
| Web UI    | `ui` | ui   | 80   | The web interface; WebDAV is served at `/dav` |

The port is bound on the `main` MultiHost and is not masked.

## Installation and First-Run Flow

There are two paths in, and they differ in whether you are asked for anything.

**Switching from File Browser.** Because the two share a package id, the marketplace offers a **Switch** button rather than Install. The migration carries the configured session timeout across and marks the admin credential as already present; Quantum then converts the database in place on its first start. Users, password hashes and the admin flag all survive, the user signs in with the credentials they already had, and no task is raised. StartOS presents the reverse button too, regardless of the migration graph, and then refuses it at install time — see [Limitations and Differences](#limitations-and-differences).

**Fresh install.** No migration runs, so the store is empty and a `critical` task blocks startup until Set Admin Password has been run. That also forecloses upstream's `quickSetup`, which would otherwise create an admin whose password is literally `admin`.

Either way the `chown` oneshot runs before the daemon on every start; a first start that fails is almost always a volume ownership problem it was meant to prevent.

## Actions

Two actions, both user-facing.

### Set Admin Password

Creates or resets the `admin` user with a freshly generated password. Run it when the install task prompts, and any time you need to regain access.

- **What it changes:** the user record in `filebrowser.db`, granting the admin permission, and `adminInitialized` in the package store.
- **Availability:** only while the service is stopped. Quantum holds an exclusive lock on the database while running, and the CLI reports `the database is locked` against a live server.
- **Cost:** seconds. It runs in a temporary subcontainer, so the password is never written to package state.
- **Repeat safety:** safe to re-run; each run generates a fresh password and invalidates the previous one.
- **Outputs:** the username and the new password, the password masked and copyable, shown once.

### Set Session Timeout

Sets how many hours a browser session lasts before it is terminated.

- **What it changes:** `auth.tokenExpirationHours` in `config.yaml`.
- **Availability:** any status.
- **Cost:** seconds, then a restart, which signs everyone out once.
- **Repeat safety:** idempotent; the form is pre-filled with the current value. Values below one hour are rejected, because Quantum validates nothing here and would issue tokens that are already expired.

Quantum binds its configuration once at startup and has no watcher, so the restart is what applies the new value.

## Tasks

One task, raised on a fresh install only, and it blocks the service until you clear it.

| Task               | Severity   | Raised when                                                            | Cleared when    |
| ------------------ | ---------- | ---------------------------------------------------------------------- | --------------- |
| Set Admin Password | `critical` | The store has no admin credential — i.e. a fresh install, not a switch | The action runs |

The condition is re-evaluated on every init, so the task returns if `adminInitialized` is ever cleared.

## Health Checks

One check, on the only daemon.

| Check     | Displayed       | Method                          |
| --------- | --------------- | ------------------------------- |
| `primary` | "Web Interface" | `GET /health` on the local port |

The endpoint is registered on both the authenticated and the public router, so the check needs no credentials. It reflects "the HTTP server is up" rather than "indexing has finished" — search results stay incomplete for a while after the check first passes on a large volume, and that is expected rather than a fault.

A failure means the process is down or crash-looping. On a first start the likeliest cause is ownership on one of the four volumes, which the `chown` oneshot exists to prevent: Quantum aborts on `cacheDir failed to create test file: permission denied` or `could not open database: permission denied`, and a `/srv` left root-owned instead lets browsing work while every write returns 403.

## Backups and Restore

Three volumes are copied wholesale — `sdk.Backups.ofVolumes('data', 'database', 'config')`. No dump step.

- **Included:** every file the user has stored, the database with its users, shares and access rules, and the generated config.
- **Excluded:** `cache`. The search index, thumbnails and generated icons are all rebuilt on demand.
- **Restore:** complete. Accounts and passwords come back as they were, so the install task does not reappear.

**A backup taken before switching is the only route back to File Browser.** The conversion is one-way and destructive — File Browser cannot read the database once Quantum has rewritten it, and the package keeps no private copy of the original. This is why both the release notes and the File Browser end-of-life notice tell the user to take one first.

Note the size implication: `data` is the whole file tree, so the backup is as large as what the user has stored.

## Limitations and Differences

1. **Per-user folder restrictions do not survive the switch.** File Browser stored a single `scope` string per user; Quantum reads a `scopes[]` list, finds it absent, and assigns the source's default of `/`. An account confined to a subfolder can afterwards list the entire shared volume, so every restricted account must be re-checked after switching. This is upstream behavior, reproduced and verified.
2. **Existing share links break.** The records migrate and the hashes still resolve, but the content 404s because File Browser shares carry no source name — and they do not appear in the admin share list, so they cannot be cleaned up from the UI.
3. **Access rules do not carry over.** Upstream documents this as intended; they must be recreated.
4. **Shell commands and runners are gone.** Upstream removed them deliberately and says they will not return.
5. **The switch is one-way.** No reverse edge is published, so StartOS refuses an install of the unflavored line over this one. The refusal is clean — it happens before any data is touched and the service is rolled back — but the only way to run File Browser again is to restore a backup taken before switching.
6. **Quantum never appears on the Updates page for a File Browser install.** Flavors are incomparable rather than ordered, so the switch is something the user chooses — which is correct here, because it widens permissions on restricted accounts.
7. **The 2.x line is not packaged.** It is beta, it replaces BoltDB with SQLite, and its migration path silently strips the admin flag from a File Browser database; upstream recommends the packaged line for production.
8. **No riscv64 build.** x86_64 and aarch64 only.

---

## Quick Reference for AI Consumers

```yaml
package_id: filebrowser # the #quantum flavor; filebrowser-startos is the unflavored one
image: gtstef/filebrowser
architectures:
  - x86_64
  - aarch64
subcontainers:
  - filebrowser-sub # the running daemon, and the chown oneshot
  - setadmin # temporary; the Set Admin Password action
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
dependencies: []
interfaces:
  ui: { type: ui, port: 80 } # web UI, and WebDAV at /dav
actions:
  - set-admin-password # only-stopped
  - set-expiration
tasks:
  - { action: set-admin-password, severity: critical } # fresh install only
health_checks:
  - primary # the daemon's ready check, displayed "Web Interface"
```
