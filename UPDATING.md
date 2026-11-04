# Updating the upstream version

## Determining the upstream version

**FileBrowser Quantum** — [gtsteffaniak/filebrowser](https://github.com/gtsteffaniak/filebrowser):

```sh
gh release list -R gtsteffaniak/filebrowser --limit 20 | grep -- '-stable'
```

**Select by the `-stable` name suffix, not by the API's `prerelease` flag.** Upstream runs parallel `beta` and `stable` release lines and flags almost everything `prerelease: false` — `v2.0.1-beta` and `v2.0.0-beta` both report `false`. Only the stable job sets `make_latest`.

Track the newest `-stable` release across major lines.

The Docker tag **drops the leading `v`**: git `v1.5.2-stable` publishes as `1.5.2-stable`. Both `1.5.2` and `v1.5.2-stable` 404. Confirm before pinning:

```sh
curl -fsSL "https://hub.docker.com/v2/repositories/gtstef/filebrowser/tags/<tag>" \
  | jq -r '.images[] | "\(.architecture) \(.os)"'
```

Note the Docker Hub namespace is **`gtstef`**, not `gtsteffaniak`; the latter is a 404. `ghcr.io/gtsteffaniak/filebrowser` carries identical digests.

## Applying the bump

Edit `startos/manifest/index.ts` and set `dockerVersion`.

Preserve the complete upstream version, including `-stable`, in both the image tag and the ExVer upstream portion, behind the `#quantum:` flavor prefix: `v1.5.8-stable` becomes image tag `1.5.8-stable` and package version `#quantum:1.5.8-stable:0`. Do not strip the suffix.

For minor and major updates, check the config schema against the tag you are pinning (`backend/config.yaml` and `frontend/public/config.generated.yaml`) rather than an unversioned docs site.

The `legacy` image stays pinned to `1.5.8-stable`. Do not bump it alongside the application.
