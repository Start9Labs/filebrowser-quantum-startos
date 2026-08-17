import { sdk } from '../sdk'
import { setAdminPassword } from './setAdminPassword'
import { setExpiration } from './setExpiration'

export const actions = sdk.Actions.of()
  .addAction(setAdminPassword)
  .addAction(setExpiration)
