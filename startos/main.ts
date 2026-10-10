import { configYaml } from './fileModels/config.yaml'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { chownCommand, configFile, databaseFile, healthCommand, mounts } from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting FileBrowser Quantum'))

  // set-expiration writes this file while the service is running, and Quantum
  // reads its config only at startup; re-running main on a change is what
  // restarts it so the new timeout applies.
  await configYaml.read().const(effects)

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
          // The image bakes both of these at /home/filebrowser/data, which
          // nothing mounts.
          FILEBROWSER_CONFIG: configFile,
          FILEBROWSER_DATABASE_PATH: databaseFile,
        },
      },
      ready: {
        display: i18n('Web Interface'),
        fn: () =>
          sdk.healthCheck.runHealthScript(
            healthCommand,
            subcontainer,
            { errorMessage: i18n('The web interface is not ready') },
          ),
      },
      requires: ['chown'],
    })
})
