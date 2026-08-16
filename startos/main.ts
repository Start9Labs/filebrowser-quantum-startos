import { i18n } from './i18n'
import { sdk } from './sdk'
import { chownCommand, mounts, uiPort } from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting FileBrowser Quantum'))

  const subcontainer = sdk.SubContainer.of(
    effects,
    { imageId: 'filebrowser' },
    mounts,
    'filebrowser-sub',
  )

  return sdk.Daemons.of(effects)
    .addOneshot('chown', {
      subcontainer,
      exec: { command: chownCommand, user: 'root' },
      requires: [],
    })
    .addDaemon('primary', {
      subcontainer,
      exec: {
        command: sdk.useEntrypoint(),
        env: {
          // The package takes its own snapshot in the sidegrade migration.
          // Quantum's built-in backup is rewritten once per converted user, so
          // on a multi-user database it is not a pre-migration snapshot.
          FILEBROWSER_DISABLE_AUTOMATIC_BACKUP: 'true',
        },
      },
      ready: {
        display: i18n('Web Interface'),
        fn: () =>
          sdk.healthCheck.checkWebUrl(
            effects,
            `http://localhost:${uiPort}/health`,
            {
              successMessage: i18n('The web interface is ready'),
              errorMessage: i18n('The web interface is not ready'),
            },
          ),
      },
      requires: ['chown'],
    })
})
