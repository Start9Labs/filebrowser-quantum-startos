import { VersionInfo } from '@start9labs/start-sdk'
import * as fs from 'fs/promises'
import { configYaml } from '../fileModels/config.yaml'
import { storeJson } from '../fileModels/store.json'

const legacySettings = '/media/startos/volumes/config/settings.json'

// File Browser stored this as a duration string; Quantum wants whole hours.
// Its own action only ever wrote `<n>h`, so anything else keeps the default.
async function legacySessionHours(): Promise<number | undefined> {
  const raw = await fs
    .readFile(legacySettings, 'utf-8')
    .then(JSON.parse, () => undefined)
  const hours = /^(\d+)h$/.exec(raw?.tokenExpirationTime ?? '')?.[1]
  return hours ? Number(hours) : undefined
}

export const current = VersionInfo.of({
  version: '#quantum:1.5.3:0',
  releaseNotes: {
    en_US: `Updated FileBrowser Quantum to 1.5.3, a bug-fix release.

- Directory URLs containing a Windows backslash no longer produce malformed paths, which could reach outside the parent folder.
- Downloading a file or folder from the root of a share no longer fails with a server error.
- OnlyOffice documents open again in shares protected by an optional password.

Full upstream release notes: https://github.com/gtsteffaniak/filebrowser/releases/tag/v1.5.3-stable

**Switching from File Browser?** Your files, your user accounts and everyone's existing passwords carry over — Quantum reads the File Browser database directly and converts it. The switch is one-way, because File Browser is end of life, so take a StartOS backup first. Two things do not carry over: per-user folder restrictions are lost, so re-check every restricted account afterwards, and existing share links stop working and must be re-created.`,
    es_ES: `FileBrowser Quantum se ha actualizado a la versión 1.5.3, una versión de corrección de errores.

- Las URL de directorio que contienen una barra invertida de Windows ya no generan rutas malformadas que podían salir de la carpeta superior.
- La descarga de un archivo o una carpeta desde la raíz de un recurso compartido ya no falla con un error del servidor.
- Los documentos de OnlyOffice vuelven a abrirse en recursos compartidos protegidos con una contraseña opcional.

Notas de la versión completas: https://github.com/gtsteffaniak/filebrowser/releases/tag/v1.5.3-stable

**¿Vienes de File Browser?** Tus archivos, tus cuentas de usuario y las contraseñas existentes se conservan: Quantum lee directamente la base de datos de File Browser y la convierte. El cambio es irreversible, porque File Browser ha llegado al final de su vida útil, así que haz antes una copia de seguridad de StartOS. Dos cosas no se trasladan: se pierden las restricciones de carpeta por usuario, así que revisa después todas las cuentas restringidas, y los enlaces de compartición existentes dejan de funcionar y hay que volver a crearlos.`,
    de_DE: `FileBrowser Quantum wurde auf 1.5.3 aktualisiert, eine Fehlerbehebungsversion.

- Verzeichnis-URLs mit einem Windows-Backslash erzeugen keine fehlerhaften Pfade mehr, die aus dem übergeordneten Ordner ausbrechen konnten.
- Das Herunterladen einer Datei oder eines Ordners aus dem Wurzelverzeichnis einer Freigabe schlägt nicht mehr mit einem Serverfehler fehl.
- OnlyOffice-Dokumente lassen sich in Freigaben mit optionalem Passwort wieder öffnen.

Vollständige Versionshinweise: https://github.com/gtsteffaniak/filebrowser/releases/tag/v1.5.3-stable

**Wechseln Sie von File Browser?** Ihre Dateien, Ihre Benutzerkonten und alle vorhandenen Passwörter bleiben erhalten — Quantum liest die File-Browser-Datenbank direkt und konvertiert sie. Der Wechsel ist endgültig, denn File Browser wird nicht mehr gepflegt; erstellen Sie vorher eine StartOS-Sicherung. Zwei Dinge werden nicht übernommen: benutzerbezogene Ordnerbeschränkungen gehen verloren, prüfen Sie danach jedes eingeschränkte Konto, und bestehende Freigabelinks funktionieren nicht mehr und müssen neu erstellt werden.`,
    pl_PL: `FileBrowser Quantum został zaktualizowany do wersji 1.5.3, wydania z poprawkami błędów.

- Adresy URL katalogów zawierające ukośnik odwrotny systemu Windows nie tworzą już nieprawidłowych ścieżek, które mogły wychodzić poza folder nadrzędny.
- Pobieranie pliku lub folderu z katalogu głównego udostępnienia nie kończy się już błędem serwera.
- Dokumenty OnlyOffice znów otwierają się w udostępnieniach chronionych opcjonalnym hasłem.

Pełne informacje o wydaniu: https://github.com/gtsteffaniak/filebrowser/releases/tag/v1.5.3-stable

**Przechodzisz z File Browser?** Twoje pliki, konta użytkowników i istniejące hasła zostaną zachowane — Quantum odczytuje bazę danych File Browser bezpośrednio i konwertuje ją. Przejście jest nieodwracalne, ponieważ File Browser nie jest już rozwijany, więc najpierw wykonaj kopię zapasową StartOS. Dwie rzeczy nie zostaną przeniesione: ograniczenia folderów przypisane do użytkowników zostaną utracone, więc sprawdź potem każde konto z ograniczeniami, a istniejące linki udostępniania przestaną działać i trzeba je utworzyć na nowo.`,
    fr_FR: `FileBrowser Quantum a été mis à jour vers la version 1.5.3, une version de correction de bogues.

- Les URL de répertoire contenant une barre oblique inverse Windows ne produisent plus de chemins mal formés, qui pouvaient sortir du dossier parent.
- Le téléchargement d'un fichier ou d'un dossier depuis la racine d'un partage n'échoue plus avec une erreur du serveur.
- Les documents OnlyOffice s'ouvrent de nouveau dans les partages protégés par un mot de passe optionnel.

Notes de version complètes : https://github.com/gtsteffaniak/filebrowser/releases/tag/v1.5.3-stable

**Vous basculez depuis File Browser ?** Vos fichiers, vos comptes d'utilisateur et tous les mots de passe existants sont conservés : Quantum lit directement la base de données de File Browser et la convertit. La bascule est définitive, car File Browser est en fin de vie ; effectuez d'abord une sauvegarde StartOS. Deux choses ne sont pas reprises : les restrictions de dossier par utilisateur sont perdues, revérifiez ensuite chaque compte restreint, et les liens de partage existants cessent de fonctionner et doivent être recréés.`,
  },
  migrations: {
    up: async () => {},
    down: async () => {},
    // The sidegrade edge from the unflavored File Browser line. Without it the
    // flavor is an island: `canMigrateFrom` would not cover 2.x and the host
    // would refuse the switch as an unsatisfiable range.
    //
    // Deliberately one-way — there is no `down`. File Browser is end of life,
    // so the switch is not a route we offer back. Omission is how a sidegrade
    // edge expresses that; `migrations.other` takes no `IMPOSSIBLE`.
    other: {
      ['^2']: {
        up: async ({ effects }) => {
          const tokenExpirationHours = await legacySessionHours()
          if (tokenExpirationHours)
            await configYaml.merge(effects, { auth: { tokenExpirationHours } })

          // The converted database carries the user's existing credentials, so
          // there is nothing for them to set.
          await storeJson.merge(effects, { adminInitialized: true })
        },
      },
    },
  },
})
  // Lets the eight packages that depend on `filebrowser` keep their unflavored
  // version ranges: a flavored version satisfies none of them on its own.
  .satisfies('2.63.23:2')
