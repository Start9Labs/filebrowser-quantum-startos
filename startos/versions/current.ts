import { VersionInfo } from '@start9labs/start-sdk'
import * as fs from 'fs/promises'
import { configYaml } from '../fileModels/config.yaml'
import { storeJson } from '../fileModels/store.json'

const databaseFile = '/media/startos/volumes/database/filebrowser.db'
const preQuantumBackup = `${databaseFile}.pre-quantum`
const legacySettings = '/media/startos/volumes/config/settings.json'

async function exists(path: string): Promise<boolean> {
  return fs.stat(path).then(
    () => true,
    () => false,
  )
}

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
  version: '#quantum:1.5.2:0',
  releaseNotes: {
    en_US: `FileBrowser Quantum is a maintained fork of File Browser, which its own developers have wound down.

Switching from File Browser keeps your files, your user accounts and everyone's existing passwords — Quantum reads the File Browser database directly and converts it. A copy of the original is kept alongside it, so switching back restores the accounts you had.

Two things do not carry over. **Per-user folder restrictions are lost**: an account you had confined to a subfolder will be able to see the whole volume, so re-check every restricted account after switching. **Existing share links stop working** and must be re-created.

Beyond that you get instant search over an index of your files, previews for office documents, video and 3D models, per-folder access control, and WebDAV.`,
    es_ES: `FileBrowser Quantum es una bifurcación mantenida de File Browser, cuyo desarrollo original se ha detenido.

Cambiar desde File Browser conserva tus archivos, tus cuentas de usuario y las contraseñas existentes: Quantum lee directamente la base de datos de File Browser y la convierte. Se guarda una copia del original junto a ella, de modo que volver atrás restaura las cuentas que tenías.

Dos cosas no se trasladan. **Se pierden las restricciones de carpeta por usuario**: una cuenta que estuviera limitada a una subcarpeta podrá ver todo el volumen, así que revisa todas las cuentas restringidas después de cambiar. **Los enlaces de compartición existentes dejan de funcionar** y hay que volver a crearlos.

Además obtienes búsqueda instantánea sobre un índice de tus archivos, vistas previas de documentos de oficina, vídeo y modelos 3D, control de acceso por carpeta y WebDAV.`,
    de_DE: `FileBrowser Quantum ist eine gepflegte Abspaltung von File Browser, dessen eigene Entwickler das Projekt eingestellt haben.

Beim Wechsel von File Browser bleiben Ihre Dateien, Ihre Benutzerkonten und alle vorhandenen Passwörter erhalten — Quantum liest die File-Browser-Datenbank direkt und konvertiert sie. Eine Kopie des Originals wird daneben aufbewahrt, sodass ein Rückwechsel die früheren Konten wiederherstellt.

Zwei Dinge werden nicht übernommen. **Benutzerbezogene Ordnerbeschränkungen gehen verloren**: ein auf einen Unterordner beschränktes Konto kann anschließend das gesamte Volume sehen — prüfen Sie nach dem Wechsel jedes eingeschränkte Konto. **Bestehende Freigabelinks funktionieren nicht mehr** und müssen neu erstellt werden.

Darüber hinaus erhalten Sie sofortige Suche über einen Index Ihrer Dateien, Vorschauen für Office-Dokumente, Videos und 3D-Modelle, Zugriffssteuerung je Ordner und WebDAV.`,
    pl_PL: `FileBrowser Quantum to utrzymywana odnoga File Browser, którego twórcy zakończyli prace nad projektem.

Przejście z File Browser zachowuje Twoje pliki, konta użytkowników i istniejące hasła — Quantum odczytuje bazę danych File Browser bezpośrednio i konwertuje ją. Obok zapisywana jest kopia oryginału, więc powrót przywraca wcześniejsze konta.

Dwie rzeczy nie zostaną przeniesione. **Ograniczenia folderów przypisane do użytkowników zostaną utracone**: konto ograniczone do podfolderu zobaczy cały wolumin, więc po przejściu sprawdź każde konto z ograniczeniami. **Istniejące linki udostępniania przestaną działać** i trzeba je utworzyć na nowo.

Poza tym otrzymujesz natychmiastowe wyszukiwanie w indeksie plików, podglądy dokumentów biurowych, wideo i modeli 3D, kontrolę dostępu na poziomie folderu oraz WebDAV.`,
    fr_FR: `FileBrowser Quantum est une bifurcation maintenue de File Browser, dont les développeurs d'origine ont arrêté le projet.

Basculer depuis File Browser conserve vos fichiers, vos comptes d'utilisateur et tous les mots de passe existants : Quantum lit directement la base de données de File Browser et la convertit. Une copie de l'originale est conservée à côté, si bien qu'un retour en arrière restaure les comptes que vous aviez.

Deux choses ne sont pas reprises. **Les restrictions de dossier par utilisateur sont perdues** : un compte confiné à un sous-dossier pourra voir l'ensemble du volume — revérifiez chaque compte restreint après la bascule. **Les liens de partage existants cessent de fonctionner** et doivent être recréés.

Vous gagnez par ailleurs une recherche instantanée sur un index de vos fichiers, des aperçus pour les documents bureautiques, les vidéos et les modèles 3D, un contrôle d'accès par dossier et WebDAV.`,
  },
  migrations: {
    up: async () => {},
    down: async () => {},
    // Sidegrade edges to and from the unflavored File Browser line. Without
    // these the flavor is an island: `canMigrateFrom` would not cover 2.x and
    // the host would refuse the switch as an unsatisfiable range.
    other: {
      ['^2']: {
        // File Browser -> Quantum. Quantum rewrites the database in place on
        // first start, so snapshot it while it is still readable by 2.x.
        up: async ({ effects }) => {
          if ((await exists(databaseFile)) && !(await exists(preQuantumBackup)))
            await fs.copyFile(databaseFile, preQuantumBackup)

          const tokenExpirationHours = await legacySessionHours()
          if (tokenExpirationHours)
            await configYaml.merge(effects, { auth: { tokenExpirationHours } })

          // The converted database carries the user's existing credentials, so
          // there is nothing for them to set.
          await storeJson.merge(effects, { adminInitialized: true })
        },
        // Quantum -> File Browser. 2.x cannot read the converted database.
        down: async () => {
          if (await exists(preQuantumBackup))
            await fs.copyFile(preQuantumBackup, databaseFile)
        },
      },
    },
  },
})
  // Lets the eight packages that depend on `filebrowser` keep their unflavored
  // version ranges: a flavored version satisfies none of them on its own.
  .satisfies('2.63.23:0')
