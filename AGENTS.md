# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (technical reference for an AI support or administering agent) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **The package id is `filebrowser`, shared with `filebrowser-startos`.** This package is the `#quantum` ExVer flavor of that id; the two are one marketplace listing with a flavor picker, the way Bitcoin Core and Knots share `bitcoind`. Never change the `id`, and never drop `data` from `volumes` — sibling packages mount that volume by name and constrain it at compile time through `Manifest['volumes'][number]`.
- **`main` reads `config.yaml` with `.const(effects)` and that read is load-bearing.** Quantum binds its config once at startup and has no watcher, so without the reactive read `set-expiration` would write the file and change nothing until someone restarted by hand. The read was correctly absent while every field was a literal; it became necessary the moment a user-mutable key was added.
- **`server.cacheDir` must be an absolute path on a real volume.** The default is the relative string `tmp`, which resolves against the process working directory and puts the search index on ephemeral storage — rebuilt on every restart, with no error to notice. Quantum also writes and fsyncs a 10 MB probe file there on every start and treats an I/O error as fatal, so the `cache` volume must be chowned to uid 1000 along with the others.
