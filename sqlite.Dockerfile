# Used once, by the migration that moves stored paths under the Data folder:
# neither FileBrowser Quantum image carries a SQLite shell.
FROM alpine:3.22
RUN apk add --no-cache sqlite
