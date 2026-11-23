import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import {
  cachePath,
  databaseFile,
  legacyDatabaseFile,
  rootPath,
  defaultSessionHours,
  uiPort,
} from '../utils'

const loggingSchema = z.looseObject({
  levels: z.literal('info|warning|error').catch('info|warning|error'),
  output: z.literal('stdout').catch('stdout'),
})

// The name is only a label: Quantum keys accounts, shares and access rules by
// the source's path. "Files" is unusable, it collides with the /files route.
const sourceSchema = z.looseObject({
  path: z.literal(rootPath).catch(rootPath),
  name: z.literal('Storage').catch('Storage'),
})

const httpSchema = z.looseObject({
  port: z.literal(uiPort).catch(uiPort),
})

const databaseSchema = z.looseObject({
  path: z.literal(databaseFile).catch(databaseFile),
  migrateFrom: z
    .union([z.literal(''), z.literal(legacyDatabaseFile)])
    .catch(''),
})

const serverSchema = z.looseObject({
  database: databaseSchema.catch(() => databaseSchema.parse({})),
  cacheDir: z.literal(cachePath).catch(cachePath),
  // StartOS owns updates; upstream otherwise polls GitHub on a timer.
  disableUpdateCheck: z.literal(true).catch(true),
  sources: z
    .array(sourceSchema)
    .length(1)
    .catch(() => [sourceSchema.parse({})]),
  logging: z.array(loggingSchema).catch(() => [loggingSchema.parse({})]),
})

// `tokenExpirationHours` is the only key this package may write under `auth`.
// Emitting `adminPassword` — even as an empty string or null — arms a check
// that resets the admin user's password on every start, undoing both the
// password migrated from File Browser and anything the user later chooses.
const authSchema = z.looseObject({
  tokenExpirationHours: z.number().int().min(1).catch(defaultSessionHours),
})

const shape = z.looseObject({
  http: httpSchema.catch(() => httpSchema.parse({})),
  server: serverSchema.catch(() => serverSchema.parse({})),
  auth: authSchema.catch(() => authSchema.parse({})),
})

export const configYaml = FileHelper.yaml(
  { base: sdk.volumes.config, subpath: 'config.yaml' },
  shape,
)
