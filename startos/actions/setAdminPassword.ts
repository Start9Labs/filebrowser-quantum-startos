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
  async ({ effects }) => ({
    name: i18n('Set Admin Password'),
    description: i18n('Create or reset your admin user and password'),
    // CLI updates must not race the server's write-through user cache.
    allowedStatuses: 'only-stopped',
    warning: (await storeJson.read((s) => s.adminInitialized).const(effects))
      ? i18n(
          'Gives the admin account a new password and turns off its two-factor login, creating the account if it does not exist. Any password it had stops working, and the new one is shown only once.',
        )
      : null,
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
        await sub.execFail(chownCommand, { user: 'root', timeout: null })
        await sub.execFail(
          [
            'filebrowser',
            'user',
            'set',
            adminUsername,
            '--password',
            password,
            '--admin',
            '-c',
            configFile,
          ],
          { timeout: null },
        )
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
