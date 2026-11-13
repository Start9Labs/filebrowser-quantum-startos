import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { convertFileBrowserDatabase, migrateSQLiteConfig } from '../utils'
import { switchFromFileBrowser } from './v1.5.8-stable_1-quantum'

export const current = VersionInfo.of({
  version: '#quantum:2.0.2-stable:4',
  releaseNotes: {
    en_US:
      'Requires StartOS 0.4.1 or later. The password from Set Admin Password works at first login without having to be changed.',
    es_ES:
      'Requiere StartOS 0.4.1 o posterior. La contraseña de Establecer contraseña de administrador funciona en el primer inicio de sesión sin tener que cambiarla.',
    de_DE:
      'Erfordert StartOS 0.4.1 oder neuer. Das Passwort aus „Administrator-Passwort festlegen“ funktioniert bei der ersten Anmeldung, ohne dass es geändert werden muss.',
    pl_PL:
      'Wymaga StartOS 0.4.1 lub nowszego. Hasło z akcji Ustaw hasło administratora działa przy pierwszym logowaniu bez konieczności jego zmiany.',
    fr_FR:
      'Nécessite StartOS 0.4.1 ou une version ultérieure. Le mot de passe défini par Définir le mot de passe administrateur fonctionne dès la première connexion, sans devoir être changé.',
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
