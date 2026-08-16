import { configYaml } from '../fileModels/config.yaml'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

export const seedFiles = sdk.setupOnInit(async (effects) => {
  await configYaml.merge(effects, {})
  await storeJson.merge(effects, {})
})
