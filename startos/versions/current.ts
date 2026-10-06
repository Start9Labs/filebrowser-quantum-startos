import { VersionInfo, YAML } from '@start9labs/start-sdk'
import { execFile } from 'child_process'
import * as fs from 'fs/promises'
import * as path from 'path'
import { promisify } from 'util'
import { configYaml } from '../fileModels/config.yaml'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

const { main, database, data, config } = sdk.volumes
const dbFile = database.subpath('filebrowser.db')

const nonEmptyFile = (path: string) =>
  fs.stat(path).then(
    (s) => s.isFile() && s.size > 0,
    () => false,
  )

// File Browser stored this as a duration string; Quantum wants whole hours.
// Its own action only ever wrote `<n>h`, so anything else keeps the default.
async function nativeSessionHours(): Promise<number | undefined> {
  const raw = await fs
    .readFile(config.subpath('settings.json'), 'utf-8')
    .then(JSON.parse, () => undefined)
  const hours = /^(\d+)h$/.exec(raw?.tokenExpirationTime ?? '')?.[1]
  return hours ? Number(hours) : undefined
}

// A File Browser converted from StartOS 0.3.5.1 still holds everything in
// `main`: its database, `data/` (the user's files) and `start9/config.yaml`.
async function adoptLegacyVolume(): Promise<number | undefined> {
  const legacyConfig = await fs
    .readFile(main.subpath('start9/config.yaml'), 'utf-8')
    .then(YAML.parse, () => undefined)

  if (
    (await nonEmptyFile(main.subpath('filebrowser.db'))) &&
    !(await nonEmptyFile(dbFile))
  ) {
    await fs.cp(main.subpath('filebrowser.db'), dbFile)
    await fs.rm(main.subpath('filebrowser.db'))
  }

  const files = await fs.readdir(main.subpath('data')).catch(() => [])
  if (files.length)
    await promisify(execFile)('mv', [
      '-n',
      '--',
      ...files.map((f) => main.subpath(`data/${f}`)),
      data.path,
    ])
  for (const f of await fs.readdir(main.subpath('data')).catch(() => [])) {
    const ext = (await fs.stat(main.subpath(`data/${f}`))).isDirectory()
      ? ''
      : path.extname(f)
    const base = f.slice(0, f.length - ext.length)
    let name = `${base} (File Browser)${ext}`
    for (
      let n = 2;
      await fs.lstat(data.subpath(name)).then(
        () => true,
        () => false,
      );
      n++
    )
      name = `${base} (File Browser ${n})${ext}`
    await promisify(execFile)('mv', [
      '-n',
      '--',
      main.subpath(`data/${f}`),
      data.subpath(name),
    ])
    console.info(
      `${f} already exists in Quantum; File Browser's copy is now ${name}`,
    )
  }

  await fs.rm(main.subpath('start9'), { recursive: true, force: true })

  const hours = legacyConfig?.userTimeout
  return Number.isInteger(hours) && hours > 0 ? hours : undefined
}

export const current = VersionInfo.of({
  version: '#quantum:1.5.8-stable:1',
  releaseNotes: {
    en_US: `Updated FileBrowser Quantum to 1.5.8-stable. Fixes a high-severity TOTP re-enrollment vulnerability: replacing an existing second factor now requires an authenticated self or admin session (GHSA-qx86-4v5r-26g5). Existing TOTP login continues to work, and bundled ffmpeg is updated to 9.0.2.

Full upstream release notes: https://github.com/gtsteffaniak/filebrowser/releases/tag/v1.5.8-stable

**Switching from File Browser?** Your files, your user accounts and everyone's existing passwords carry over — Quantum reads the File Browser database directly and converts it. The switch is one-way, because File Browser is end of life, so take a StartOS backup first. Two things do not carry over: per-user folder restrictions are lost, so re-check every restricted account afterwards, and existing share links stop working and must be re-created.

- Set Admin Password asks for confirmation before running once an admin password exists, and says that it replaces the current password and turns off two-factor login.
- Set Session Timeout's field explains when a shorter or longer session is the better choice.
- Switching from a File Browser installed under StartOS 0.3.5.1 keeps its files, user accounts, passwords and session timeout.
- If such a switch on an earlier version left Quantum empty, this update restores the File Browser files, user accounts, passwords and session timeout. Files added in Quantum since are kept. Users and passwords set in Quantum since are replaced by the File Browser ones.`,
    es_ES: `FileBrowser Quantum se ha actualizado a 1.5.8-stable. Corrige una vulnerabilidad de gravedad alta al volver a registrar TOTP: sustituir un segundo factor existente ahora requiere una sesión autenticada del propio usuario o de un administrador (GHSA-qx86-4v5r-26g5). El inicio de sesión con TOTP existente sigue funcionando y ffmpeg se ha actualizado a 9.0.2.

Notas de la versión completas: https://github.com/gtsteffaniak/filebrowser/releases/tag/v1.5.8-stable

**¿Vienes de File Browser?** Tus archivos, tus cuentas de usuario y las contraseñas existentes se conservan: Quantum lee directamente la base de datos de File Browser y la convierte. El cambio es irreversible, porque File Browser ha llegado al final de su vida útil, así que haz antes una copia de seguridad de StartOS. Dos cosas no se trasladan: se pierden las restricciones de carpeta por usuario, así que revisa después todas las cuentas restringidas, y los enlaces de compartición existentes dejan de funcionar y hay que volver a crearlos.

- Establecer contraseña de administrador pide confirmación antes de ejecutarse cuando ya existe una contraseña de administrador, e indica que sustituye la contraseña actual y desactiva el inicio de sesión en dos pasos.
- El campo de Establecer tiempo de espera de la sesión explica cuándo conviene una sesión más corta o más larga.
- Al cambiar desde un File Browser instalado con StartOS 0.3.5.1 se conservan sus archivos, cuentas de usuario, contraseñas y tiempo de espera de la sesión.
- Si un cambio así hecho con una versión anterior dejó Quantum vacío, esta actualización restaura los archivos, cuentas de usuario, contraseñas y tiempo de espera de la sesión de File Browser. Los archivos añadidos en Quantum desde entonces se conservan. Los usuarios y contraseñas definidos en Quantum desde entonces se sustituyen por los de File Browser.`,
    de_DE: `FileBrowser Quantum wurde auf 1.5.8-stable aktualisiert. Behebt eine Sicherheitslücke hoher Schwere bei der erneuten TOTP-Einrichtung: Das Ersetzen eines bestehenden zweiten Faktors erfordert jetzt eine authentifizierte Sitzung des betroffenen Benutzers oder eines Administrators (GHSA-qx86-4v5r-26g5). Die Anmeldung mit bestehendem TOTP funktioniert weiterhin, und das mitgelieferte ffmpeg wurde auf 9.0.2 aktualisiert.

Vollständige Versionshinweise: https://github.com/gtsteffaniak/filebrowser/releases/tag/v1.5.8-stable

**Wechseln Sie von File Browser?** Ihre Dateien, Ihre Benutzerkonten und alle vorhandenen Passwörter bleiben erhalten — Quantum liest die File-Browser-Datenbank direkt und konvertiert sie. Der Wechsel ist endgültig, denn File Browser wird nicht mehr gepflegt; erstellen Sie vorher eine StartOS-Sicherung. Zwei Dinge werden nicht übernommen: benutzerbezogene Ordnerbeschränkungen gehen verloren, prüfen Sie danach jedes eingeschränkte Konto, und bestehende Freigabelinks funktionieren nicht mehr und müssen neu erstellt werden.

- „Administrator-Passwort festlegen“ fragt vor der Ausführung nach einer Bestätigung, sobald ein Administrator-Passwort existiert, und weist darauf hin, dass sie das aktuelle Passwort ersetzt und die Zwei-Faktor-Anmeldung abschaltet.
- Das Feld von „Sitzungszeitlimit festlegen“ erklärt, wann eine kürzere oder längere Sitzung die bessere Wahl ist.
- Beim Wechsel von einem unter StartOS 0.3.5.1 installierten File Browser bleiben dessen Dateien, Benutzerkonten, Passwörter und Sitzungszeitlimit erhalten.
- Hat ein solcher Wechsel mit einer früheren Version Quantum leer hinterlassen, stellt dieses Update die Dateien, Benutzerkonten, Passwörter und das Sitzungszeitlimit von File Browser wieder her. Seitdem in Quantum hinzugefügte Dateien bleiben erhalten. Seitdem in Quantum angelegte Benutzer und Passwörter werden durch die von File Browser ersetzt.`,
    pl_PL: `FileBrowser Quantum został zaktualizowany do 1.5.8-stable. Usuwa lukę bezpieczeństwa o wysokiej istotności przy ponownej konfiguracji TOTP: zastąpienie istniejącego drugiego składnika wymaga teraz uwierzytelnionej sesji danego użytkownika lub administratora (GHSA-qx86-4v5r-26g5). Logowanie z istniejącym TOTP nadal działa, a dołączony ffmpeg został zaktualizowany do 9.0.2.

Pełne informacje o wydaniu: https://github.com/gtsteffaniak/filebrowser/releases/tag/v1.5.8-stable

**Przechodzisz z File Browser?** Twoje pliki, konta użytkowników i istniejące hasła zostaną zachowane — Quantum odczytuje bazę danych File Browser bezpośrednio i konwertuje ją. Przejście jest nieodwracalne, ponieważ File Browser nie jest już rozwijany, więc najpierw wykonaj kopię zapasową StartOS. Dwie rzeczy nie zostaną przeniesione: ograniczenia folderów przypisane do użytkowników zostaną utracone, więc sprawdź potem każde konto z ograniczeniami, a istniejące linki udostępniania przestaną działać i trzeba je utworzyć na nowo.

- „Ustaw hasło administratora” prosi o potwierdzenie przed uruchomieniem, gdy hasło administratora już istnieje, i informuje, że zastępuje obecne hasło i wyłącza logowanie dwuskładnikowe.
- Pole akcji „Ustaw limit czasu sesji” wyjaśnia, kiedy lepszym wyborem jest krótsza, a kiedy dłuższa sesja.
- Przejście z File Browser zainstalowanego w StartOS 0.3.5.1 zachowuje jego pliki, konta użytkowników, hasła i limit czasu sesji.
- Jeśli takie przejście we wcześniejszej wersji zostawiło pusty Quantum, ta aktualizacja przywraca pliki, konta użytkowników, hasła i limit czasu sesji z File Browser. Pliki dodane od tego czasu w Quantum zostają zachowane. Użytkownicy i hasła ustawione od tego czasu w Quantum zostają zastąpione tymi z File Browser.`,
    fr_FR: `FileBrowser Quantum a été mis à jour vers 1.5.8-stable. Corrige une faille de sécurité de gravité élevée lors de la réinscription TOTP : remplacer un second facteur existant exige désormais une session authentifiée de l'utilisateur concerné ou d'un administrateur (GHSA-qx86-4v5r-26g5). La connexion avec un TOTP existant continue de fonctionner et ffmpeg a été mis à jour vers 9.0.2.

Notes de version complètes : https://github.com/gtsteffaniak/filebrowser/releases/tag/v1.5.8-stable

**Vous basculez depuis File Browser ?** Vos fichiers, vos comptes d'utilisateur et tous les mots de passe existants sont conservés : Quantum lit directement la base de données de File Browser et la convertit. La bascule est définitive, car File Browser est en fin de vie ; effectuez d'abord une sauvegarde StartOS. Deux choses ne sont pas reprises : les restrictions de dossier par utilisateur sont perdues, revérifiez ensuite chaque compte restreint, et les liens de partage existants cessent de fonctionner et doivent être recréés.

- Définir le mot de passe administrateur demande une confirmation avant de s'exécuter dès qu'un mot de passe administrateur existe, et indique qu'elle remplace le mot de passe actuel et désactive la connexion à deux facteurs.
- Le champ de Définir le délai d’expiration de la session explique quand une session plus courte ou plus longue est préférable.
- La bascule depuis un File Browser installé sous StartOS 0.3.5.1 conserve ses fichiers, ses comptes d'utilisateur, les mots de passe et le délai d'expiration de session.
- Si une telle bascule effectuée avec une version antérieure a laissé Quantum vide, cette mise à jour restaure les fichiers, les comptes d'utilisateur, les mots de passe et le délai d'expiration de session de File Browser. Les fichiers ajoutés dans Quantum depuis sont conservés. Les utilisateurs et mots de passe définis dans Quantum depuis sont remplacés par ceux de File Browser.`,
  },
  migrations: {
    // Repairs a switch from a 0.3.5.1 File Browser made by an earlier version,
    // which left the File Browser database and files in `main`.
    up: async ({ effects }) => {
      if (!(await nonEmptyFile(main.subpath('filebrowser.db')))) return
      if (await nonEmptyFile(dbFile))
        await fs.rename(
          dbFile,
          database.subpath(
            `filebrowser.quantum-${new Date().toISOString().slice(0, 10)}.db`,
          ),
        )
      const tokenExpirationHours = await adoptLegacyVolume()
      if (tokenExpirationHours)
        await configYaml.merge(effects, { auth: { tokenExpirationHours } })
      await storeJson.merge(effects, { adminInitialized: true })
    },
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
          const tokenExpirationHours =
            (await adoptLegacyVolume()) ?? (await nativeSessionHours())
          if (tokenExpirationHours)
            await configYaml.merge(effects, { auth: { tokenExpirationHours } })

          // Without a File Browser database Quantum's first start creates
          // admin/admin, so the install task has to stay.
          if (await nonEmptyFile(dbFile))
            await storeJson.merge(effects, { adminInitialized: true })
        },
      },
    },
  },
})
  // Lets the eight packages that depend on `filebrowser` keep their unflavored
  // version ranges: a flavored version satisfies none of them on its own.
  .satisfies('2.63.23:3')
