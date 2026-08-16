import { sdk } from './sdk'

export const uiPort = 80
export const dataPath = '/srv'
export const databasePath = '/database'
export const configPath = '/config'
export const cachePath = '/cache'

export const databaseFile = `${databasePath}/filebrowser.db`
export const configFile = `${configPath}/config.yaml`

// Written by the sidegrade migration before Quantum first rewrites the database.
export const preQuantumBackup = `${databaseFile}.pre-quantum`

export const adminUsername = 'admin'

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
