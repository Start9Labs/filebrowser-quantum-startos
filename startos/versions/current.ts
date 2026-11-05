import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { convertFileBrowserDatabase, migrateSQLiteConfig } from '../utils'
import { switchFromFileBrowser } from './v1.5.8-stable_1-quantum'

export const current = VersionInfo.of({
  version: '#quantum:2.0.2-stable:3',
  releaseNotes: {
    en_US:
      'Requires StartOS 0.4.1 or later. Fixes memory use growing while the service runs.',
    es_ES:
      'Requiere StartOS 0.4.1 o posterior. Corrige el aumento del uso de memoria mientras el servicio está en ejecución.',
    de_DE:
      'Erfordert StartOS 0.4.1 oder neuer. Behebt einen während der Laufzeit des Dienstes ansteigenden Speicherverbrauch.',
    pl_PL:
      'Wymaga StartOS 0.4.1 lub nowszego. Naprawia wzrost zużycia pamięci podczas działania usługi.',
    fr_FR:
      "Nécessite StartOS 0.4.1 ou une version ultérieure. Corrige l'augmentation de la consommation de mémoire pendant le fonctionnement du service.",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
    // The only way in from File Browser; keep it on whichever version is current.
    other: {
      ['^2']: {
        up: async ({ effects }) => {
          await switchFromFileBrowser(effects)
          await convertFileBrowserDatabase(effects)
          await migrateSQLiteConfig(effects)
        },
      },
    },
  },
  // The latest published unflavored File Browser version, which dependents' unflavored ranges accept.
}).satisfies('2.63.23:4')
