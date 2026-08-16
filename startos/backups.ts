import { sdk } from './sdk'

// `cache` holds the search index, thumbnails and generated icons, all rebuilt
// on demand.
export const { createBackup, restoreInit } = sdk.setupBackups(async () =>
  sdk.Backups.ofVolumes('data', 'database', 'config'),
)
