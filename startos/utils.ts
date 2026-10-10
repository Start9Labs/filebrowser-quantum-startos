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
export const dataPath = '/srv'
export const databasePath = '/database'
export const configPath = '/config'
export const cachePath = '/cache'

export const legacyDatabaseName = 'filebrowser.db'
export const legacyDatabaseFile = `${databasePath}/${legacyDatabaseName}`
export const databaseFile = `${databasePath}/filebrowser.sqlite`
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
  if (!(await nonEmptyFile(sdk.volumes.database.subpath(legacyDatabaseName)))) return
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
        await subcontainer.execFail(chownCommand, { user: 'root', timeout: null })
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
                sdk.healthCheck.runHealthScript(
                  healthCommand,
                  subcontainer,
                  { errorMessage: 'Waiting for File Browser database conversion' },
                ),
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

export const mounts = sdk.Mounts.of()
  .mountVolume({
    volumeId: 'data',
    subpath: null,
    mountpoint: dataPath,
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
