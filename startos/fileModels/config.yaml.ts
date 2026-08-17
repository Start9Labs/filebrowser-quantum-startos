import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import {
  cachePath,
  databaseFile,
  dataPath,
  defaultSessionHours,
  uiPort,
} from '../utils'

const loggingSchema = z.object({
  levels: z.literal('info|warning|error').catch('info|warning|error'),
  output: z.literal('stdout').catch('stdout'),
})

const sourceSchema = z.object({
  path: z.literal(dataPath).catch(dataPath),
  name: z.literal('Files').catch('Files'),
})

const serverSchema = z.object({
  port: z.literal(uiPort).catch(uiPort),
  database: z.literal(databaseFile).catch(databaseFile),
  cacheDir: z.literal(cachePath).catch(cachePath),
  // StartOS owns updates; upstream otherwise polls GitHub on a timer.
  disableUpdateCheck: z.literal(true).catch(true),
  sources: z.array(sourceSchema).catch(() => [sourceSchema.parse({})]),
  logging: z.array(loggingSchema).catch(() => [loggingSchema.parse({})]),
})

// `tokenExpirationHours` is the only key this package may write under `auth`.
// Emitting `adminPassword` — even as an empty string or null — arms a check
// that resets the admin user's password on every start, undoing both the
// password migrated from File Browser and anything the user later chooses.
const authSchema = z.object({
  tokenExpirationHours: z.number().int().min(1).catch(defaultSessionHours),
})

const shape = z.object({
  server: serverSchema.catch(() => serverSchema.parse({})),
  auth: authSchema.catch(() => authSchema.parse({})),
})

export const configYaml = FileHelper.yaml(
  { base: sdk.volumes.config, subpath: 'config.yaml' },
  shape,
)
