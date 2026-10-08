import { configYaml } from '../fileModels/config.yaml'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { defaultSessionHours } from '../utils'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  timeout: Value.number({
    name: i18n('Session Timeout'),
    description: i18n(
      'How long someone stays signed in to the web interface before having to log in again. A shorter time is safer where FileBrowser Quantum is opened on shared or public devices; a longer one means logging in less often.',
    ),
    required: true,
    default: defaultSessionHours,
    integer: true,
    units: i18n('hours'),
    // Upstream validates nothing here, and zero or less issues tokens that are
    // already expired -- every authenticated request would fail.
    min: 1,
  }),
})

export const setExpiration = sdk.Action.withInput(
  // id
  'set-expiration',

  // metadata
  async () => ({
    name: i18n('Set Session Timeout'),
    description: i18n(
      'Determine how long a browser session lasts before it is automatically terminated',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // form input specification
  inputSpec,

  // optionally pre-fill the input form
  async () => ({
    timeout: (await configYaml.read().once())?.auth.tokenExpirationHours,
  }),

  // the execution function
  async ({ effects, input }) =>
    configYaml.merge(effects, {
      auth: { tokenExpirationHours: input.timeout },
    }),
)
