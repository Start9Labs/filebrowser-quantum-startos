import { configYaml } from './fileModels/config.yaml'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  chownCommand,
  configFile,
  databaseFile,
  healthCommand,
  mounts,
  nameSharedFolders,
  sharedFolderPath,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting FileBrowser Quantum'))

  const subcontainer = sdk.SubContainer.of(
    effects,
    { imageId: 'filebrowser' },
    mounts,
    'filebrowser-sub',
  )

  // Each granted shared volume becomes a folder beside Data. Granting,
  // revoking or changing one re-runs main, which rebuilds the top level.
  const granted = nameSharedFolders(await sdk.getSharedVolumes(effects).const())
  const mounted: typeof granted = []
  const unavailable: typeof granted = []
  for (const volume of granted) {
    const outcome = await subcontainer.tryMountSharedVolume({
      id: volume.id,
      mountpoint: sharedFolderPath(volume.name),
      readonly: volume.readonly,
    })
    ;(outcome.kind === 'mounted' ? mounted : unavailable).push(volume)
  }
  // set-expiration writes this file while the service is running, and Quantum
  // reads its config only at startup; re-running main on a change is what
  // restarts it so the new timeout applies.
  await configYaml.read().const(effects)

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
          sdk.healthCheck.runHealthScript(healthCommand, subcontainer, {
            message: () => i18n('The web interface is ready'),
            errorMessage: i18n('The web interface is not ready'),
          }),
      },
      requires: ['chown'],
    })
    .addHealthCheck('shared-volumes', () =>
      granted.length
        ? {
            ready: {
              display: i18n('Shared Volumes'),
              // Decided when the volumes were mounted, so check once.
              gracePeriod: 0,
              trigger: async function* () {
                yield
              },
              fn: () =>
                unavailable.length
                  ? {
                      result: 'failure' as const,
                      message: i18n('Not available: ${names}', {
                        names: unavailable.map((v) => v.name).join(', '),
                      }),
                    }
                  : {
                      result: 'success' as const,
                      message: i18n('Shown as folders beside Data: ${names}', {
                        names: mounted.map((v) => v.name).join(', '),
                      }),
                    },
            },
            requires: [],
          }
        : null,
    )
})
