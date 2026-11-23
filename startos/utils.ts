import { T, YAML } from '@start9labs/start-sdk'
import * as fs from 'fs/promises'
import { sdk } from './sdk'

// Upstream defaults to 80. The image runs as uid 1000 with no
// CAP_NET_BIND_SERVICE, and a subcontainer keeps the kernel's 1024 floor.
export const uiPort = 8080
export const healthCommand: [string, ...string[]] = [
  'curl',
  '--fail',
  '--silent',
  `http://localhost:${uiPort}/health`,
]
// The one source Quantum serves. It is the image's own root-owned directory,
// so nothing can be created at the top level; each entry in it is a mount.
export const rootPath = '/srv'
export const dataFolder = 'Data'
export const dataPath = `${rootPath}/${dataFolder}`
export const databasePath = '/database'
export const configPath = '/config'
export const cachePath = '/cache'

/**
 * Gives each shared volume the folder it is mounted as beside Data: its name,
 * made safe as one path segment and unique among the top-level folders.
 */
export function nameSharedFolders<V extends { id: string; name: string }>(
  volumes: V[],
): V[] {
  const taken = new Set([dataFolder.toLowerCase()])
  return [...volumes]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((volume) => {
      const cleaned = volume.name.replace(/[\\/]+/g, '-').trim()
      const base = /^\.*$/.test(cleaned) ? volume.id : cleaned
      let name = base
      for (let n = 2; taken.has(name.toLowerCase()); n++)
        name = `${base} (${n})`
      taken.add(name.toLowerCase())
      return { ...volume, name }
    })
}

export const sharedFolderPath = (name: string) => `${rootPath}/${name}`

export const legacyDatabaseName = 'filebrowser.db'
export const legacyDatabaseFile = `${databasePath}/${legacyDatabaseName}`
export const databaseName = 'filebrowser.sqlite'
export const databaseFile = `${databasePath}/${databaseName}`
export const configFile = `${configPath}/config.yaml`

export const adminUsername = 'admin'

// Matches the File Browser package's default, so a switch does not silently
// change how long sessions last.
export const defaultSessionHours = 12

// Quantum runs as uid 1000 and fsyncs a probe file into cacheDir on every
// start, treating an I/O error there as fatal.
export const chownCommand: [string, ...string[]] = [
  'chown',
  '-R',
  '1000:1000',
  dataPath,
  databasePath,
  configPath,
  cachePath,
]

export const randomPassword = {
  charset: 'a-z,A-Z,1-9',
  len: 22,
}

export const nonEmptyFile = (path: string) =>
  fs.stat(path).then(
    (s) => s.isFile() && s.size > 0,
    () => false,
  )

export async function migrateSQLiteConfig(effects: T.Effects) {
  const { configYaml } = await import('./fileModels/config.yaml')
  await configYaml.merge(effects, {})
  const config = await configYaml.read().once()
  if (!config) throw new Error('FileBrowser configuration is missing')
  delete config.server.port
  config.server.database.migrateFrom = (await nonEmptyFile(
    sdk.volumes.database.subpath(legacyDatabaseName),
  ))
    ? legacyDatabaseFile
    : ''
  await configYaml.write(effects, config)
}

export async function convertFileBrowserDatabase(effects: T.Effects) {
  if (!(await nonEmptyFile(sdk.volumes.database.subpath(legacyDatabaseName))))
    return
  const { configYaml } = await import('./fileModels/config.yaml')
  await configYaml.merge(effects, {})
  const config = await configYaml.read().once()
  if (!config) throw new Error('FileBrowser configuration is missing')
  const { http, ...legacyConfig } = config
  const legacyConfigFile = `${configPath}/config.v1.yaml`
  await fs.writeFile(
    sdk.volumes.config.subpath('config.v1.yaml'),
    YAML.stringify({
      ...legacyConfig,
      server: {
        ...legacyConfig.server,
        port: http.port,
        listen: '127.0.0.1',
        database: legacyDatabaseFile,
      },
    }),
  )
  try {
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'legacy' },
      mounts,
      'convert-filebrowser',
      async (subcontainer) => {
        await subcontainer.execFail(chownCommand, {
          user: 'root',
          timeout: null,
        })
        // SQLite's importer cannot translate File Browser's legacy `perm` fields.
        await sdk.Daemons.of(effects)
          .addDaemon('convert', {
            subcontainer,
            exec: {
              command: ['filebrowser'],
              env: {
                FILEBROWSER_CONFIG: legacyConfigFile,
                FILEBROWSER_DATABASE: legacyDatabaseFile,
                FILEBROWSER_DISABLE_AUTOMATIC_BACKUP: 'true',
              },
            },
            ready: {
              display: null,
              fn: () =>
                sdk.healthCheck.runHealthScript(healthCommand, subcontainer, {
                  errorMessage: 'Waiting for File Browser database conversion',
                }),
            },
            requires: [],
          })
          .runUntilSuccess(null)
      },
    )
  } finally {
    await fs.rm(sdk.volumes.config.subpath('config.v1.yaml'), { force: true })
  }
}

// Guarded by its own marker row, so a second run changes nothing.
const moveUnderDataSql = `
-- FileBrowser Quantum 2.0.2: move everything keyed under source '/srv' one level down into '/Data'.
-- v2 rule: a scope of '/' (or '') on '/srv' stays '/', admin or not; only narrower scopes get '/Data'.
-- Run with the server STOPPED:  sqlite3 -bail filebrowser.sqlite '.read migrate-v2.sql'
-- Re-running is a no-op: every statement is gated on the marker row inserted at the end.
.bail on
BEGIN IMMEDIATE;

CREATE TABLE IF NOT EXISTS startos_migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL);
CREATE TEMP TABLE _go AS
  SELECT NOT EXISTS (SELECT 1 FROM startos_migrations WHERE name = 'srv-to-srv-Data') AS go;

-- 1. Sidebar links ($.settings.sidebarLinks[].target, sourceName = source path).
--    Targets are relative to the user's scope, so they need the prefix exactly for users whose
--    scope stays put ('/' or ''). The root link '/' stays the root. Users with a narrower scope
--    have their scope shifted in step 2 instead, so their links are left alone.
UPDATE users SET user_data = json_set(user_data, '$.settings.sidebarLinks', (
  SELECT json_group_array(json(v)) FROM (
    SELECT CASE
        WHEN json_extract(l.value, '$.sourceName') = '/srv'
         AND json_extract(l.value, '$.target') NOT IN ('/', '')
        THEN json_set(l.value, '$.target',
               '/Data' || CASE WHEN json_extract(l.value, '$.target') LIKE '/%' THEN '' ELSE '/' END
                       || json_extract(l.value, '$.target'))
        ELSE l.value END AS v
    FROM json_each(users.user_data, '$.settings.sidebarLinks') l ORDER BY l.key)))
WHERE (SELECT go FROM _go)
  AND json_type(user_data, '$.settings.sidebarLinks') = 'array'
  AND EXISTS (SELECT 1 FROM json_each(users.user_data, '$.backendScopes') s
              WHERE json_extract(s.value, '$.path') = '/srv'
                AND json_extract(s.value, '$.scope') IN ('/', ''));

-- 2. Scopes ($.backendScopes[] with path = '/srv'): S -> '/Data' || S for S not in ('/', '').
UPDATE users SET user_data = json_set(user_data, '$.backendScopes', (
  SELECT json_group_array(json(v)) FROM (
    SELECT CASE
        WHEN json_extract(s.value, '$.path') = '/srv'
         AND json_extract(s.value, '$.scope') NOT IN ('/', '')
        THEN json_set(s.value, '$.scope',
               '/Data' || CASE WHEN json_extract(s.value, '$.scope') LIKE '/%' THEN '' ELSE '/' END
                       || json_extract(s.value, '$.scope'))
        ELSE s.value END AS v
    FROM json_each(users.user_data, '$.backendScopes') s ORDER BY s.key)))
WHERE (SELECT go FROM _go)
  AND json_type(user_data, '$.backendScopes') = 'array';

-- 3. Pinned items ($.pinnedItems."/srv" = { "<index dir path, trailing slash>": [names] }).
--    Keys are full index paths (not scope-relative), so every key is prefixed for every user.
UPDATE users SET user_data = json_set(user_data, '$.pinnedItems."/srv"', (
  SELECT json_group_object('/Data' || p.key, json(p.value))
  FROM json_each(users.user_data, '$.pinnedItems."/srv"') p))
WHERE (SELECT go FROM _go)
  AND json_type(user_data, '$.pinnedItems."/srv"') = 'object';

-- 4. Shares: path is the full index path, no trailing slash ('/docs/b.txt', '/docs/sub').
UPDATE shares SET path = '/Data' || CASE WHEN path IN ('/', '') THEN '' WHEN path LIKE '/%' THEN path ELSE '/' || path END
WHERE (SELECT go FROM _go) AND source = '/srv';

-- 5. Access rules: full index path, directories with a trailing slash ('/docs/sub/', root '/').
--    Two passes because of UNIQUE(source, path).
UPDATE access_rules SET path = char(1) || path WHERE (SELECT go FROM _go) AND source = '/srv';
UPDATE access_rules SET path = '/Data' || CASE WHEN substr(path, 2) LIKE '/%' THEN '' ELSE '/' END || substr(path, 2)
WHERE (SELECT go FROM _go) AND source = '/srv' AND path LIKE char(1) || '%';

-- 6. index_info: cached scan statistics keyed by top-level directory; drop so they are rebuilt.
DELETE FROM index_info WHERE (SELECT go FROM _go) AND path = '/srv';

INSERT OR IGNORE INTO startos_migrations (name, applied_at) VALUES ('srv-to-srv-Data', strftime('%s', 'now'));
DROP TABLE _go;
COMMIT;
`

/**
 * Carries a database written while the `data` volume was the whole source
 * over to the layout where it is the `Data` folder inside it: every stored
 * path gains that folder. An account that had the whole source keeps it.
 */
export async function moveUnderDataFolder(effects: T.Effects) {
  const { database, cache } = sdk.volumes
  if (!(await nonEmptyFile(database.subpath(databaseName)))) {
    // Nothing has been stored yet, or it is still in the legacy database,
    // which Quantum only imports when it starts.
    if (!(await nonEmptyFile(database.subpath(legacyDatabaseName)))) return
    await importLegacyDatabase(effects)
  }
  const script = 'move-under-data.sql'
  await fs.writeFile(database.subpath(script), moveUnderDataSql)
  try {
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'sqlite' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'database',
        subpath: null,
        mountpoint: databasePath,
        readonly: false,
      }),
      'move-under-data',
      (sub) =>
        sub.execFail(
          ['sqlite3', '-bail', databaseFile, `.read ${databasePath}/${script}`],
          { user: 'root', timeout: null },
        ),
    )
  } finally {
    await fs.rm(database.subpath(script), { force: true })
  }
  // The search index lives outside the database and would keep answering
  // with the old paths; Quantum rebuilds it.
  await fs.rm(cache.subpath('sql'), { recursive: true, force: true })
}

// Runs Quantum once, in the layout the legacy database was written for, so
// its importer creates the SQLite database before the paths are moved.
async function importLegacyDatabase(effects: T.Effects) {
  await migrateSQLiteConfig(effects)
  await sdk.SubContainer.withTemp(
    effects,
    { imageId: 'filebrowser' },
    mountsWithDataAt(rootPath),
    'import-filebrowser',
    async (subcontainer) => {
      await subcontainer.execFail(
        ['chown', '-R', '1000:1000', databasePath, configPath, cachePath],
        { user: 'root', timeout: null },
      )
      await sdk.Daemons.of(effects)
        .addDaemon('import', {
          subcontainer,
          exec: {
            command: sdk.useEntrypoint(),
            env: {
              FILEBROWSER_CONFIG: configFile,
              FILEBROWSER_DATABASE_PATH: databaseFile,
            },
          },
          ready: {
            display: null,
            fn: () =>
              sdk.healthCheck.runHealthScript(healthCommand, subcontainer, {
                errorMessage: 'Waiting for the legacy database import',
              }),
          },
          requires: [],
        })
        .runUntilSuccess(null)
    },
  )
}

const mountsWithDataAt = (mountpoint: string) =>
  sdk.Mounts.of()
    .mountVolume({
      volumeId: 'data',
      subpath: null,
      mountpoint,
      readonly: false,
    })
    .mountVolume({
      volumeId: 'database',
      subpath: null,
      mountpoint: databasePath,
      readonly: false,
    })
    .mountVolume({
      volumeId: 'config',
      subpath: null,
      mountpoint: configPath,
      readonly: false,
    })
    .mountVolume({
      volumeId: 'cache',
      subpath: null,
      mountpoint: cachePath,
      readonly: false,
    })

export const mounts = mountsWithDataAt(dataPath)
