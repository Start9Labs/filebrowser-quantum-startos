import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  adminUsername,
  chownCommand,
  configFile,
  mounts,
  randomPassword,
} from '../utils'

export const setAdminPassword = sdk.Action.withoutInput(
  // id
  'set-admin-password',

  // metadata
  async () => ({
    name: i18n('Set Admin Password'),
    description: i18n('Create or reset your admin user and password'),
    // Quantum holds an exclusive lock on the database while it runs, so the
    // CLI cannot reach it until the service is stopped.
    allowedStatuses: 'only-stopped',
    warning: null,
    group: null,
    visibility: 'enabled',
  }),

  // the execution function
  async ({ effects }) => {
    const password = utils.getDefaultString(randomPassword)

    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'filebrowser' },
      mounts,
      'setadmin',
      async (sub) => {
        // On a fresh install the daemon's chown oneshot has not run yet.
        await sub.execFail(chownCommand, { user: 'root' })
        // `-u` must come first: the subcommand reads it positionally.
        await sub.execFail([
          'filebrowser',
          'set',
          '-u',
          `${adminUsername},${password}`,
          '-a',
          '-c',
          configFile,
        ])
      },
    )

    await storeJson.merge(effects, { adminInitialized: true })

    return {
      version: '1',
      title: i18n('Success!'),
      message: i18n(
        'Your admin username and password are below. Write them down or save them to a password manager.',
      ),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Username'),
            description: null,
            value: adminUsername,
            masked: false,
            copyable: true,
            qr: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: password,
            masked: true,
            copyable: true,
            qr: false,
          },
        ],
      },
    }
  },
)
