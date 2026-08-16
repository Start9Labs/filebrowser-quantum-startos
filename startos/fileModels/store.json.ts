import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.object({
  // Set by the action, and by the sidegrade migration since a converted File
  // Browser database already carries working credentials.
  adminInitialized: z.boolean().optional().catch(undefined),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.config, subpath: 'startos.json' },
  shape,
)
