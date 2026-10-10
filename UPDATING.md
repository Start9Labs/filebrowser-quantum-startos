# Updating the upstream version

## Determining the upstream version

**FileBrowser Quantum** — [gtsteffaniak/filebrowser](https://github.com/gtsteffaniak/filebrowser):

```sh
gh release list -R gtsteffaniak/filebrowser --limit 20 | grep -- '-stable'
```

**Select by the `-stable` name suffix, not by the API's `prerelease` flag.** Upstream runs parallel `beta` and `stable` release lines and flags almost everything `prerelease: false` — `v2.0.1-beta` and `v2.0.0-beta` both report `false`. Only the stable job sets `make_latest`.

Track the newest `-stable` release across major lines. The 2.x stable line is published. Treat a major jump as a breaking-change pass: the 2.x configuration moves HTTP settings to `http`, changes `server.database` to an object, and uses `FILEBROWSER_DATABASE_PATH`.

The Docker tag **drops the leading `v`**: git `v1.5.2-stable` publishes as `1.5.2-stable`. Both `1.5.2` and `v1.5.2-stable` 404. Confirm before pinning:

```sh
curl -fsSL "https://hub.docker.com/v2/repositories/gtstef/filebrowser/tags/<tag>" \
  | jq -r '.images[] | "\(.architecture) \(.os)"'
```

Note the Docker Hub namespace is **`gtstef`**, not `gtsteffaniak`; the latter is a 404. `ghcr.io/gtsteffaniak/filebrowser` carries identical digests.

## Applying the bump

Edit `startos/manifest/index.ts` and set `dockerVersion`, then bump `version` in `startos/versions/current.ts` — keeping the `#quantum:` flavor prefix — and rewrite `releaseNotes`.

Preserve the complete upstream version, including `-stable`, in both the image tag and the ExVer upstream portion: `v1.5.8-stable` becomes image tag `1.5.8-stable` and package version `#quantum:1.5.8-stable:0`. ExVer sorts suffixed versions below the same numeric version without a suffix, but the suffix is upstream's stable-channel identifier, not a beta. Do not strip it or republish older releases under corrected versions; the next upstream patch sorts above the previously published numeric version.

Two declarations must remain on the current version:

- **`.satisfies(...)`** on `current`. The alias makes this flavored version acceptable to the eight packages that depend on `filebrowser` with unflavored ranges. Keep it at the latest published unflavored File Browser version.
- **`migrations.other['^2']`** — the sidegrade edge from the unflavored line. Sidegrade edges live on whichever version is current; drop it and this flavor becomes unreachable from File Browser. Do not add a matching `down`: the switch is one-way by design.

For minor and major updates, check the config schema against the tag you are pinning (`backend/config.yaml` and `frontend/public/config.generated.yaml`) rather than an unversioned docs site. Follow the guide's patch scope for patch releases.

The `legacy` image stays pinned to `1.5.8-stable`: it converts original File Browser BoltDB records before the SQLite importer runs. Do not bump it alongside the application. Direct SQLite import cannot translate original File Browser's `perm` fields; the intermediate conversion keeps admin rights and passwords. The new database is `/database/filebrowser.sqlite`; the original BoltDB remains at `/database/filebrowser.db`. Set `server.database.migrateFrom` only when that BoltDB is present, since upstream rejects a missing import source even after SQLite exists.

The outgoing version carries a data migration, so apply the guide's historical-version rule before replacing `current.ts`. Keep the legacy volume repair in its original version and the sidegrade edge on `current`.

Whatever you do, do not add an `auth` block to the generated config: a non-empty `auth.adminPassword` makes Quantum reset that user's password on every start.
