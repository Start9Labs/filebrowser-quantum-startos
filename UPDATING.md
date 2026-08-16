# Updating the upstream version

## Determining the upstream version

**FileBrowser Quantum** — [gtsteffaniak/filebrowser](https://github.com/gtsteffaniak/filebrowser):

```sh
gh release list -R gtsteffaniak/filebrowser --limit 20 | grep -- '-stable'
```

**Select by the `-stable` name suffix, not by the API's `prerelease` flag.** Upstream runs parallel `beta` and `stable` release lines and flags almost everything `prerelease: false` — `v2.0.1-beta` and `v2.0.0-beta` both report `false`. Only the stable job sets `make_latest`.

**Stay on the 1.x line for now.** The 2.x line is in beta: upstream's own guidance is "start with v1.5.x (stable) for the most reliable experience" and "stay on stable for production", there is no `stable/v2.x` branch, and its migration path silently strips the admin flag and all file permissions when importing a File Browser database. All security advisories are patched in both lines, so there is no security cost to waiting. Revisit when a `-stable` 2.x tag exists.

The Docker tag **drops the leading `v`**: git `v1.5.2-stable` publishes as `1.5.2-stable`. Both `1.5.2` and `v1.5.2-stable` 404. Confirm before pinning:

```sh
curl -fsSL "https://hub.docker.com/v2/repositories/gtstef/filebrowser/tags/<tag>" \
  | jq -r '.images[] | "\(.architecture) \(.os)"'
```

Note the Docker Hub namespace is **`gtstef`**, not `gtsteffaniak`; the latter is a 404. `ghcr.io/gtsteffaniak/filebrowser` carries identical digests.

## Applying the bump

Edit `startos/manifest/index.ts` and set `dockerVersion`, then bump `version` in `startos/versions/current.ts` — keeping the `#quantum:` flavor prefix — and rewrite `releaseNotes`.

The `-stable` suffix belongs **only** in the image tag. ExVer parses it as a prerelease, so `1.5.2-stable:0` would sort *below* `1.5.2:0`.

Two things must move with it:

- **`.satisfies(...)`** on `current`. The alias makes this flavored version acceptable to the eight packages that depend on `filebrowser` with unflavored ranges. Keep it at the latest published unflavored File Browser version.
- **`migrations.other['^2']`** — the sidegrade edges to and from the unflavored line. Sidegrade edges live on whichever version is current; drop them and this flavor becomes unreachable from File Browser.

Check the config schema against the tag you are pinning (`backend/config.yaml` and `frontend/public/config.generated.yaml` in the repo) rather than the docs site, which documents the unreleased 2.x schema. `startos/fileModels/config.yaml.ts` pins every key as a literal, so a renamed key fails closed rather than silently reverting to a default.

Whatever you do, do not add an `auth` block to the generated config: a non-empty `auth.adminPassword` makes Quantum reset that user's password on every start.
