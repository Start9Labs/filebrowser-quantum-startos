# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

**Start every task at the recipe index** — `../start-technologies/projects/start-sdk/docs/src/recipes.md`
(or <https://docs.start9.com/packaging/recipes.html>). It maps an intent ("prompt the user to create
admin credentials", "expose a web UI") to the constructs, the reference pages, and a named production
package to copy. Find the recipe before you read this package's neighbours: a package you reach by
grepping may be non-conformant, and the recipe outranks it.

Freshly scaffolded? Work the
[New Package Checklist](../start-technologies/projects/start-sdk/docs/src/new-package-checklist.md)
(or <https://docs.start9.com/packaging/new-package-checklist.html>) from top to bottom. It is a
guide page, not a file in this repo — read it, don't copy it in.

Keep `README.md` (technical reference for an AI support or administering agent) and
`instructions.md` (end-user docs) in sync with your changes.

**Bugs and feature requests are GitHub issues on this repo** — file them as you find them.
Don't record work in the repo instead: no `TODO.md`, no `NOTES.md`, no `PLAN.md`. What you
verified, tried, and decided belongs in the commit message and the PR body.

## This repo

- **The package id is `filebrowser`, shared with `filebrowser-startos`.** This package is the `#quantum` ExVer flavor of that id; the two are one marketplace listing with a flavor picker, the way Bitcoin Core and Knots share `bitcoind`. Never change the `id`, and never drop `data` from `volumes` — sibling packages mount that volume by name and constrain it at compile time through `Manifest['volumes'][number]`.
- **`main` reads `config.yaml` with `.const(effects)` and that read is load-bearing.** Quantum binds its config once at startup and has no watcher, so without the reactive read `set-expiration` would write the file and change nothing until someone restarted by hand. The read was correctly absent while every field was a literal; it became necessary the moment a user-mutable key was added.
- **`server.cacheDir` must be an absolute path on a real volume.** The default is the relative string `tmp`, which resolves against the process working directory and puts the search index on ephemeral storage — rebuilt on every restart, with no error to notice. Quantum also writes and fsyncs a 10 MB probe file there on every start and treats an I/O error as fatal, so the `cache` volume must be chowned to uid 1000 along with the others.
