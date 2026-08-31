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
  version: '#quantum:1.5.6:0',
  releaseNotes: {
    en_US: `Updated FileBrowser Quantum to 1.5.6, with a moderate security fix and several bug fixes.

- Anonymous visitors to public shares can no longer use the metadata API to read text-file contents after the download limit is exhausted or the file viewer is disabled (GHSA-55mw-cwg7-m8f5).
- Saving an existing share without changing its password now preserves the password.
- The home and login pages no longer get stuck on a loading spinner after the content-security hardening.
- The OnlyOffice document editor loads again.

Full upstream changes: https://github.com/gtsteffaniak/filebrowser/compare/v1.5.4-stable...v1.5.6-stable

**Switching from File Browser?** Your files, your user accounts and everyone's existing passwords carry over — Quantum reads the File Browser database directly and converts it. The switch is one-way, because File Browser is end of life, so take a StartOS backup first. Two things do not carry over: per-user folder restrictions are lost, so re-check every restricted account afterwards, and existing share links stop working and must be re-created.`,
    es_ES: `FileBrowser Quantum se ha actualizado a la versión 1.5.6, con una corrección de seguridad de gravedad moderada y varias correcciones de errores.

- Los visitantes anónimos de recursos compartidos públicos ya no pueden usar la API de metadatos para leer el contenido de archivos de texto cuando se agota el límite de descargas o se desactiva el visor de archivos (GHSA-55mw-cwg7-m8f5).
- Al guardar un recurso compartido existente sin cambiar su contraseña, ahora se conserva la contraseña.
- Las páginas de inicio y de acceso ya no se quedan bloqueadas en un indicador de carga tras el refuerzo de la seguridad del contenido.
- El editor de documentos OnlyOffice vuelve a cargarse.

Todos los cambios de upstream: https://github.com/gtsteffaniak/filebrowser/compare/v1.5.4-stable...v1.5.6-stable

**¿Vienes de File Browser?** Tus archivos, tus cuentas de usuario y las contraseñas existentes se conservan: Quantum lee directamente la base de datos de File Browser y la convierte. El cambio es irreversible, porque File Browser ha llegado al final de su vida útil, así que haz antes una copia de seguridad de StartOS. Dos cosas no se trasladan: se pierden las restricciones de carpeta por usuario, así que revisa después todas las cuentas restringidas, y los enlaces de compartición existentes dejan de funcionar y hay que volver a crearlos.`,
    de_DE: `FileBrowser Quantum wurde auf 1.5.6 aktualisiert und enthält eine Sicherheitsbehebung mittleren Schweregrads sowie mehrere Fehlerbehebungen.

- Anonyme Besucher öffentlicher Freigaben können die Metadaten-API nicht mehr verwenden, um den Inhalt von Textdateien zu lesen, nachdem das Download-Limit erreicht oder die Dateiansicht deaktiviert wurde (GHSA-55mw-cwg7-m8f5).
- Beim Speichern einer bestehenden Freigabe ohne Passwortänderung bleibt das Passwort nun erhalten.
- Die Start- und Anmeldeseiten bleiben nach der Verschärfung der Content-Security-Policy nicht mehr in einer Ladeanzeige hängen.
- Der Dokumenteneditor OnlyOffice lädt wieder.

Alle Änderungen von Upstream: https://github.com/gtsteffaniak/filebrowser/compare/v1.5.4-stable...v1.5.6-stable

**Wechseln Sie von File Browser?** Ihre Dateien, Ihre Benutzerkonten und alle vorhandenen Passwörter bleiben erhalten — Quantum liest die File-Browser-Datenbank direkt und konvertiert sie. Der Wechsel ist endgültig, denn File Browser wird nicht mehr gepflegt; erstellen Sie vorher eine StartOS-Sicherung. Zwei Dinge werden nicht übernommen: benutzerbezogene Ordnerbeschränkungen gehen verloren, prüfen Sie danach jedes eingeschränkte Konto, und bestehende Freigabelinks funktionieren nicht mehr und müssen neu erstellt werden.`,
    pl_PL: `FileBrowser Quantum został zaktualizowany do wersji 1.5.6, która zawiera poprawkę luki bezpieczeństwa o średniej istotności i kilka poprawek błędów.

- Anonimowi odwiedzający publiczne udostępnienia nie mogą już używać API metadanych do odczytywania zawartości plików tekstowych po wyczerpaniu limitu pobierania lub wyłączeniu przeglądarki plików (GHSA-55mw-cwg7-m8f5).
- Zapisanie istniejącego udostępnienia bez zmiany hasła zachowuje teraz to hasło.
- Strony główna i logowania nie zatrzymują się już na wskaźniku ładowania po zaostrzeniu zasad bezpieczeństwa treści.
- Edytor dokumentów OnlyOffice znów się wczytuje.

Wszystkie zmiany w projekcie źródłowym: https://github.com/gtsteffaniak/filebrowser/compare/v1.5.4-stable...v1.5.6-stable

**Przechodzisz z File Browser?** Twoje pliki, konta użytkowników i istniejące hasła zostaną zachowane — Quantum odczytuje bazę danych File Browser bezpośrednio i konwertuje ją. Przejście jest nieodwracalne, ponieważ File Browser nie jest już rozwijany, więc najpierw wykonaj kopię zapasową StartOS. Dwie rzeczy nie zostaną przeniesione: ograniczenia folderów przypisane do użytkowników zostaną utracone, więc sprawdź potem każde konto z ograniczeniami, a istniejące linki udostępniania przestaną działać i trzeba je utworzyć na nowo.`,
    fr_FR: `FileBrowser Quantum a été mis à jour vers la version 1.5.6, avec un correctif de sécurité de gravité modérée et plusieurs corrections de bogues.

- Les visiteurs anonymes des partages publics ne peuvent plus utiliser l'API de métadonnées pour lire le contenu des fichiers texte une fois la limite de téléchargement atteinte ou la visionneuse de fichiers désactivée (GHSA-55mw-cwg7-m8f5).
- L'enregistrement d'un partage existant sans modifier son mot de passe conserve désormais ce mot de passe.
- Les pages d'accueil et de connexion ne restent plus bloquées sur un indicateur de chargement après le renforcement de la politique de sécurité du contenu.
- L'éditeur de documents OnlyOffice se charge de nouveau.

Tous les changements en amont : https://github.com/gtsteffaniak/filebrowser/compare/v1.5.4-stable...v1.5.6-stable

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
