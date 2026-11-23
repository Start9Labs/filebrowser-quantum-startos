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
  - [The top level](#the-top-level)
  - [Shared volumes](#shared-volumes)
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

The upstream image is used unmodified, with its own entrypoint, and one subcontainer runs the service. A small Alpine image carrying the SQLite shell (`sqlite.Dockerfile`) is used only by the migration that moves stored paths under `Data`. A second, fixed legacy image is used only during upgrades and flavor switches to normalize BoltDB records before SQLite import; `convert-filebrowser` starts it temporarily on loopback and waits for successful HTTP readiness before shutting it down.

Package versions retain upstream's `-stable` suffix even though ExVer sorts suffixed versions as prereleases. The image comes from upstream's stable release line.

| Property      | Value                                                                |
| ------------- | -------------------------------------------------------------------- |
| Image         | `gtstef/filebrowser`                                                 |
| Architectures | x86_64, aarch64                                                      |
| Entrypoint    | Upstream default                                                     |
| Runs as       | uid 1000                                                             |
| Subcontainer  | `filebrowser-sub` — the `primary` daemon, and the one to `attach` to |

The Docker namespace is `gtstef`, not `gtsteffaniak`; the full name resolves only on GHCR, which mirrors the same digests.

A `chown` oneshot runs as root before the daemon on every start, handing the four package volumes it mounts to uid 1000. It names `/srv/Data`, never `/srv`, so it cannot reach a shared volume, whose files belong to the user and to every other service granted it. The Set Admin Password action uses its own short-lived subcontainer, `setadmin`, and repeats the same `chown` there because on a fresh install the daemon's oneshot has not run yet.

`FILEBROWSER_CONFIG` and `FILEBROWSER_DATABASE_PATH` override the image's unmounted paths under `/home/filebrowser/data`. The configuration also pins `server.database.path` to the mounted SQLite database. The legacy converter alone uses `FILEBROWSER_DATABASE` and disables its misleading per-user automatic BoltDB backups with `FILEBROWSER_DISABLE_AUTOMATIC_BACKUP`.

## Volume and Data Layout

Five volumes. `data`, `database`, `config` and `main` are inherited from `filebrowser-startos` and keep their ids, because a switch reuses them in place.

| Volume     | Mount Point | Purpose                                                                         |
| ---------- | ----------- | ------------------------------------------------------------------------------- |
| `data`     | `/srv/Data` | The user's files — sibling packages mount this volume by name as a library      |
| `database` | `/database` | `filebrowser.sqlite`, SQLite journals, and the retained `filebrowser.db` import source |
| `config`   | `/config`   | The generated `config.yaml` and the package store                               |
| `cache`    | `/cache`    | The search index, thumbnails and generated icons                                |
| `main`     | —           | Empty, except where a legacy File Browser install left its data |

`cache` is new relative to File Browser and is not optional. `server.cacheDir` defaults to the relative string `tmp`, which resolves against the process working directory and would put the search index on ephemeral storage, rebuilding it on every restart with nothing to indicate it. It must be an absolute path on a real volume, which is what the model enforces.

Quantum writes nothing into the `data` volume by itself — verified by diffing the tree across a full run including indexing. That matters because the volume is shared with other packages.

### The top level

Quantum serves one source, `/srv`, shown as **Storage**. `/srv` is not a volume: it is the image's own root-owned directory on the subcontainer's filesystem, and every entry in it is a mount.

| Entry           | What it is                                 |
| --------------- | ------------------------------------------ |
| `Data`          | The `data` volume                          |
| `<volume name>` | One folder per shared volume granted to it |

Because `/srv` belongs to root and Quantum runs as uid 1000, nothing can be created, renamed or deleted at the top level — the attempt returns `permission denied`. The set of folders there is rebuilt on every start from the volumes granted at that moment. Sibling packages still mount the `data` volume directly and see only its contents; nothing is mounted inside a package volume.

Every path Quantum stores is relative to `/srv`, so a file in the `data` volume is `/Data/…`. Releases before `#quantum:2.0.2-stable:5` mounted `data` at `/srv` itself; see [Installation and First-Run Flow](#installation-and-first-run-flow) for how their stored paths are carried over.

### Shared volumes

The package declares `sharedVolumes: true`, so StartOS offers it under **System → Shared Volumes** and on the service's own **Shared Volumes** tab. Each volume granted there is mounted at `/srv/<name>` and appears as a top-level folder beside `Data`.

| Grant      | Mount      | In Quantum                                                        |
| ---------- | ---------- | ----------------------------------------------------------------- |
| Read/write | read/write | An ordinary folder                                                |
| Read       | read-only  | Browsable; an upload, edit or delete fails with a read-only error |
| No Access  | none       | The folder is gone                                                |

The folder name is the volume's name with `/` and `\` replaced by `-`. A name already taken at the top level — `Data`, or another volume, compared without regard to case — gets ` (2)`, ` (3)` and so on, assigned in volume-id order so it is stable across starts.

**Who sees a shared volume** follows from Quantum's ordinary scopes. An account whose scope is `/` — every account, unless an admin narrowed it — sees `Data` and every granted volume. An account scoped to `/Data`, or to a folder inside it, sees none of them. A scope is a single path, so "Data and one volume but not another" is done with an access rule denying the other folder, not with the scope.

**Renaming a volume in StartOS renames its folder** at the next restart; a rename does not restart the service. Scopes, shares, access rules and sidebar links that pointed into the old folder name stop resolving and have to be redone.

Granting, revoking or changing the access of a volume restarts the service, because the mounts are made when its container is created. So does a volume becoming available or unavailable.

A granted volume that cannot be mounted — a network share that is offline, an external drive that is unplugged — does not stop the service. `Data` and the other volumes keep working, and the `shared-volumes` health check names what is missing.

Shared volumes are user-owned and are not part of this package's data: they are not `chown`ed, not included in the service backup, and not removed on uninstall.

Every volume must be owned by uid 1000, which the `chown` oneshot guarantees. Quantum writes and fsyncs a 10 MB probe file into `cacheDir` on every start and treats any I/O error there as fatal, and the database ships mode `0640`, so world-readable is not sufficient.

## File Models

Two models. One is the upstream config file, almost entirely package-owned; the other is StartOS-side state.

| File           | Format | Modelled                | Written by                                            |
| -------------- | ------ | ----------------------- | ----------------------------------------------------- |
| `config.yaml`  | YAML   | Yes — `FileHelper.yaml` | Every init, the switch migration, Set Session Timeout |
| `startos.json` | JSON   | Yes — `FileHelper.json` | Install, the switch migration, Set Admin Password     |

**Enforced** in `config.yaml` on every package write: `http.port`, `server.database.path`, `cacheDir`, exactly one source — `/srv`, named `Storage` — logging, and `disableUpdateCheck`, which is on here because StartOS owns updates. `server.database.migrateFrom` is seeded by the upgrade or switch migration only when a non-empty BoltDB exists, and remains set to that retained file; fresh installs leave it empty. Removing that file requires clearing `migrateFrom` too, otherwise upstream refuses to start even after import.

The migration writes a temporary `config.v1.yaml` for the legacy converter and removes it afterwards. No admin password is added to either configuration.

**Yours:** `auth.tokenExpirationHours`, through Set Session Timeout. It is the only key the package may ever write under `auth`. A non-empty `auth.adminPassword` makes Quantum reset that user's password on _every_ start, which would both destroy a password carried over from File Browser and stop the user from ever setting their own — so the field is not emitted at all, and the admin credential is applied through the upstream CLI instead.

`startos.json` holds one flag, `adminInitialized`. It is set by Set Admin Password and by the switch migration when a File Browser database is present — that database already carries working credentials — and it is what the install task tests and what makes Set Admin Password ask for confirmation. Clearing it by hand re-raises that task.

Everything else about Quantum — users, permissions, shares, access rules, branding — lives in its database rather than in a file, and is configured inside the application.

## Dependencies

None. Other services depend on this package instead, mounting its `data` volume as a read-only library.

Those dependents declare unflavored version ranges, which a flavored version satisfies on its own for none of them; the package therefore declares an unflavored alias so their ranges keep resolving across the switch, and they need no changes.

## Network Access and Interfaces

One interface. Nothing is exported for dependent services — a dependent reaches the files through a volume mount instead.

| Interface | Id   | Type | Port | Description                                   |
| --------- | ---- | ---- | ---- | --------------------------------------------- |
| Web UI    | `ui` | ui   | 8080 | The web interface; WebDAV is served at `/dav` |

The port is bound on the `main` MultiHost and is not masked.

Upstream listens on 80 and the image exposes it, but the image also runs as uid 1000 with no `CAP_NET_BIND_SERVICE`, and a subcontainer keeps the kernel's 1024 floor on unprivileged binds — so the package moves the listener to 8080 through `http.port` rather than handing the daemon root. StartOS fronts it either way; the port is not one a user sees.

## Installation and First-Run Flow

There are two paths in, and they differ in whether you are asked for anything.

**Switching from File Browser.** The migration adopts its database, files and session timeout, including data still held in `main` by a legacy install, and marks credentials initialized when a database exists. It runs the legacy Quantum image temporarily to translate File Browser's user records before the SQLite importer sees them. Direct SQLite import cannot translate File Browser's `perm` fields; the intermediate conversion retains administrator rights and passwords. A switch with no database still raises the initial credential task.

**Updating an existing Quantum install.** The historical migration repairs unfinished legacy-volume switches first. The new migration normalizes the BoltDB through the legacy image and writes the SQLite configuration, dropping the obsolete `server.port`. On the first normal start, upstream imports users, shares, access rules and signing state into `/database/filebrowser.sqlite`; it keeps the BoltDB and rebuilds the search index as needed. Reserve extra disk space and allow startup time for the import. Later starts use SQLite without reimporting the old data.

The legacy repair keeps a displaced Quantum database as `filebrowser.quantum-<date>.db`. Colliding files or folders are renamed to `<name> (File Browser)` and logged rather than overwritten. A downgrade from SQLite is prohibited; the retained BoltDB does not contain any subsequent account or share changes.

**Updating from a release before `#quantum:2.0.2-stable:5`.** Those releases served the `data` volume as the whole source, so a file was `/photos/a.jpg`; it is now `/Data/photos/a.jpg`. The update migration rewrites what the database stores by path so that it still points at the same files:

| Stored item                                   | What happens                                                    |
| --------------------------------------------- | --------------------------------------------------------------- |
| An account scoped to a folder                 | Gains the `/Data` prefix — it sees exactly what it saw before   |
| An account scoped to `/`                      | Stays at `/` — it now also sees any granted shared volume       |
| Share links, access rules, pinned items       | Gain the `/Data` prefix                                         |
| Sidebar links of an account scoped to `/`     | Gain the `/Data` prefix                                         |
| The search index (in `cache`) and scan stats  | Deleted; Quantum rebuilds them on start                         |
| The activity log                              | Left as written; old entries show the old paths                 |

The rewrite runs once, in the `move-under-data` subcontainer, and records itself in a `startos_migrations` table inside `filebrowser.sqlite` so it can never be applied twice. If the SQLite database does not exist yet — an install updated straight from the BoltDB era that has not started since — the migration first runs Quantum once, in the old layout, in an `import-filebrowser` subcontainer so its importer creates the database, then rewrites it.

Paths held _outside_ the service are not rewritten: WebDAV clients, browser bookmarks and scripts must add `/Data`. The source is also renamed from `Data` to `Storage`, which changes the `/files/<source>/…` segment of bookmarked URLs.

**Fresh install.** No migration runs, so the store is empty and a `critical` task blocks startup until Set Admin Password has been run. The action replaces upstream's automatically generated bootstrap credential with the password shown in StartOS.

Either way the `chown` oneshot runs before the daemon on every start; a first start that fails is almost always a volume ownership problem it was meant to prevent.

## Actions

Two actions, both user-facing.

### Set Admin Password

Creates or resets the `admin` user with a freshly generated password. Run it when the install task prompts, and any time you need to regain access.

- **What it changes:** the `admin` user record in `filebrowser.sqlite` — created if no user of that name exists, otherwise given the new password with password login selected and its two-factor (TOTP) enrollment cleared — granting the admin permission, and `adminInitialized` in the package store.
- **Operation:** runs `user set admin --password … --admin` against the stopped service's database. Keeping it stopped avoids concurrent updates to the server's write-through user cache.
- **Confirmation:** once `adminInitialized` is set, asks before running, warning that the current password stops working and two-factor login is turned off. The first run on a fresh install, from the install task, does not ask.
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

One task, raised on a fresh install (or a switch with no database to carry), and it blocks the service until you clear it.

| Task               | Severity   | Raised when                                                                                          | Cleared when    |
| ------------------ | ---------- | ---------------------------------------------------------------------------------------------------- | --------------- |
| Set Admin Password | `critical` | The store has no admin credential — a fresh install, or a switch that found no File Browser database | The action runs |

The condition is re-evaluated on every init, so the task returns if `adminInitialized` is ever cleared.

## Health Checks

One check on the only daemon, and a second that exists only while at least one shared volume is granted.

| Check            | Displayed        | Method                                                   |
| ---------------- | ---------------- | -------------------------------------------------------- |
| `primary`        | "Web Interface"  | `curl --fail` requests `/health` on the local port       |
| `shared-volumes` | "Shared Volumes" | Reports the outcome of this start's shared-volume mounts |

`shared-volumes` succeeds listing the folders that were mounted, or fails listing the granted volumes that could not be. It is decided once per start and does not poll. A failure there leaves the web interface, `Data` and the other volumes working; check the volume under **System → Shared Volumes**, and restart the service once the source is back if it has not restarted by itself.

The endpoint returns HTTP success with a JSON `message` of `ok`, and needs no credentials. The check rejects HTTP errors rather than treating any response as ready. It reflects "the HTTP server is up" rather than "indexing has finished" — search results stay incomplete for a while after the check first passes on a large volume, and that is expected rather than a fault.

A failure means the process is down or crash-looping. On a first start the likeliest cause is ownership on one of the four mounted volumes, which the `chown` oneshot exists to prevent: Quantum aborts on `cacheDir failed to create test file: permission denied` or `could not open database: permission denied`, and a `/srv` left root-owned instead lets browsing work while every write returns 403.

## Backups and Restore

Three volumes are copied wholesale — `sdk.Backups.ofVolumes('data', 'database', 'config')`. No dump step.

- **Included:** every file the user has stored, the database with its users, shares and access rules, and the generated config.
- **Excluded:** `cache`. The search index, thumbnails and generated icons are all rebuilt on demand.
- **Excluded:** the contents of shared volumes. They are separate backup items in StartOS; select them alongside the service to protect those files. A restored shared volume is a new volume with no grants: grant it again, and it reappears under its name.
- **Restore:** complete. Accounts and passwords come back as they were, so the install task does not reappear.

**A backup taken before switching or updating is the only supported route back.** The intermediate conversion rewrites File Browser's BoltDB records. SQLite import retains that converted BoltDB, but does not write later changes back to it. Volume backups capture SQLite and its journals together, along with the retained import source; restoring a pre-SQLite backup runs the upgrade migrations again.

Note the size implication: `data` is the whole file tree, so the backup is as large as what the user has stored.

## Limitations and Differences

1. **Per-user folder restrictions do not survive the switch.** File Browser stored a single `scope` string per user; Quantum reads a `scopes[]` list, finds it absent, and assigns the source's default of `/`. An account confined to a subfolder can afterwards list the entire shared volume, so every restricted account must be re-checked after switching. This is upstream behavior, reproduced and verified.
2. **Existing share links break.** The records migrate and the hashes still resolve, but the content 404s because File Browser shares carry no source name — and they do not appear in the admin share list, so they cannot be cleaned up from the UI.
3. **Access rules do not carry over.** Upstream documents this as intended; they must be recreated.
4. **Shell commands and runners are gone.** Upstream removed them deliberately and says they will not return.
5. **The switch is one-way.** No reverse edge is published, so StartOS refuses an install of the unflavored line over this one. The refusal is clean — it happens before any data is touched and the service is rolled back — but the only way to run File Browser again is to restore a backup taken before switching.
6. **Quantum never appears on the Updates page for a File Browser install.** Flavors are incomparable rather than ordered, so the switch is something the user chooses — which is correct here, because it widens permissions on restricted accounts.
7. **SQLite updates cannot be downgraded in place.** Restore a pre-update backup instead; the retained BoltDB is an import source, not a live mirror.
8. **No riscv64 build.** x86_64 and aarch64 only.
9. **A granted shared volume is visible to every account scoped to `/`**, which is every account an admin has not narrowed. Narrow an account to `/Data` before granting a volume it should not see.
10. **Search can name a file an access rule hides.** For an account whose scope is not `/`, Quantum 2.0.2's search lists filenames inside a folder a deny rule covers; opening and downloading them is still refused. Upstream behavior, reproduced on a fresh database.
11. **Shared volumes need StartOS 0.4.3.** The package requires it from `#quantum:2.0.2-stable:5` on.

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
  - move-under-data # temporary; rewrites stored paths when updating from before 2.0.2-stable:5
  - import-filebrowser # temporary; creates the SQLite database first when that update finds none
  - convert-filebrowser # temporary; legacy BoltDB normalization during migration
volumes:
  data: /srv/Data
  database: /database
  config: /config
  cache: /cache
  main: null # not mounted; the switch migration adopts legacy data
source: /srv # the one Quantum source, "Storage"; root-owned, holds Data and one folder per granted shared volume
shared_volumes: /srv/<volume name> # never chowned, never backed up
file_models:
  - /config/config.yaml
  - /config/startos.json
startos_managed_env_vars:
  - FILEBROWSER_CONFIG
  - FILEBROWSER_DATABASE_PATH
dependencies: []
interfaces:
  ui: { type: ui, port: 8080 } # web UI, and WebDAV at /dav
actions:
  - set-admin-password # only-stopped; warns once adminInitialized is set
  - set-expiration
tasks:
  - { action: set-admin-password, severity: critical } # fresh install, or a switch with no database
health_checks:
  - primary # the daemon's ready check, displayed "Web Interface"
  - shared-volumes # only while a shared volume is granted; fails naming volumes that did not mount
```
