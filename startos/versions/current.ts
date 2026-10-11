import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { convertFileBrowserDatabase, migrateSQLiteConfig } from '../utils'
import { switchFromFileBrowser } from './v1.5.8-stable_1-quantum'

export const current = VersionInfo.of({
  version: '#quantum:2.0.0-stable:0',
  releaseNotes: {
    en_US: `Updated FileBrowser Quantum to 2.0.0-stable. Adds per-source file permissions, activity logs, improved media playback and more reliable long transfers.

**Back up before updating.** The first start imports the old database into SQLite; allow extra time and disk space for the new database and rebuilt search index. The old database is retained, but changes made after updating are not written back to it. Downgrading requires restoring a backup. Check user permissions and share links after updating; legacy API download routes have changed.

**Switching from File Browser?** Take a backup first. Files, accounts, passwords and admin rights carry over through an intermediate conversion. Folder restrictions and access rules must be recreated, and old share links stop working. The switch is one-way.

Full upstream release notes: https://github.com/gtsteffaniak/filebrowser/releases/tag/v2.0.0-stable`,
    es_ES: `FileBrowser Quantum se ha actualizado a 2.0.0-stable. Añade permisos de archivos por origen, registros de actividad, mejoras en la reproducción multimedia y transferencias largas más fiables.

**Haz una copia de seguridad antes de actualizar.** El primer inicio importa la base de datos antigua a SQLite; reserva tiempo y espacio adicionales para la nueva base de datos y el índice de búsqueda reconstruido. La base de datos antigua se conserva, pero los cambios posteriores no se escriben en ella. Para volver atrás hay que restaurar una copia de seguridad. Revisa los permisos de usuario y los enlaces de compartición; las rutas antiguas de descarga de la API han cambiado.

**¿Vienes de File Browser?** Haz antes una copia de seguridad. Los archivos, cuentas, contraseñas y derechos de administrador se trasladan mediante una conversión intermedia. Debes recrear las restricciones de carpeta y las reglas de acceso; los enlaces antiguos dejan de funcionar. El cambio es irreversible.

Notas completas de la versión: https://github.com/gtsteffaniak/filebrowser/releases/tag/v2.0.0-stable`,
    de_DE: `FileBrowser Quantum wurde auf 2.0.0-stable aktualisiert. Fügt Dateiberechtigungen je Quelle, Aktivitätsprotokolle, verbesserte Medienwiedergabe und zuverlässigere lange Übertragungen hinzu.

**Vor dem Update eine Sicherung erstellen.** Beim ersten Start wird die alte Datenbank in SQLite importiert; planen Sie zusätzliche Zeit und Speicherplatz für die neue Datenbank und den neu aufgebauten Suchindex ein. Die alte Datenbank bleibt erhalten, spätere Änderungen werden jedoch nicht darin gespeichert. Eine Rückkehr erfordert das Wiederherstellen einer Sicherung. Prüfen Sie Benutzerberechtigungen und Freigabelinks; alte API-Downloadrouten haben sich geändert.

**Wechseln Sie von File Browser?** Erstellen Sie vorher eine Sicherung. Dateien, Konten, Passwörter und Administratorrechte werden über eine Zwischenkonvertierung übernommen. Ordnerbeschränkungen und Zugriffsregeln müssen neu eingerichtet werden; alte Freigabelinks funktionieren nicht mehr. Der Wechsel ist endgültig.

Vollständige Versionshinweise: https://github.com/gtsteffaniak/filebrowser/releases/tag/v2.0.0-stable`,
    pl_PL: `FileBrowser Quantum został zaktualizowany do 2.0.0-stable. Dodaje uprawnienia do plików dla poszczególnych źródeł, dzienniki aktywności, ulepszone odtwarzanie multimediów i bardziej niezawodne długie transfery.

**Przed aktualizacją wykonaj kopię zapasową.** Pierwsze uruchomienie importuje starą bazę do SQLite; zapewnij dodatkowy czas i miejsce na nową bazę oraz odbudowany indeks wyszukiwania. Stara baza zostaje zachowana, ale późniejsze zmiany nie są w niej zapisywane. Powrót wymaga przywrócenia kopii zapasowej. Sprawdź uprawnienia użytkowników i linki udostępniania; stare trasy pobierania API uległy zmianie.

**Przechodzisz z File Browser?** Najpierw wykonaj kopię zapasową. Pliki, konta, hasła i uprawnienia administratora są przenoszone przez konwersję pośrednią. Ograniczenia folderów i reguły dostępu trzeba utworzyć ponownie; stare linki udostępniania przestają działać. Przejście jest nieodwracalne.

Pełne informacje o wydaniu: https://github.com/gtsteffaniak/filebrowser/releases/tag/v2.0.0-stable`,
    fr_FR: `FileBrowser Quantum a été mis à jour vers 2.0.0-stable. Ajoute des permissions de fichiers par source, des journaux d'activité, une lecture multimédia améliorée et des transferts longs plus fiables.

**Effectuez une sauvegarde avant la mise à jour.** Le premier démarrage importe l'ancienne base dans SQLite ; prévoyez du temps et de l'espace supplémentaires pour la nouvelle base et l'index de recherche reconstruit. L'ancienne base est conservée, mais les modifications ultérieures n'y sont pas écrites. Revenir en arrière exige de restaurer une sauvegarde. Vérifiez les permissions et les liens de partage ; les anciennes routes de téléchargement de l'API ont changé.

**Vous basculez depuis File Browser ?** Effectuez d'abord une sauvegarde. Les fichiers, comptes, mots de passe et droits d'administrateur sont repris via une conversion intermédiaire. Les restrictions de dossier et règles d'accès doivent être recréées ; les anciens liens de partage cessent de fonctionner. La bascule est définitive.

Notes de version complètes : https://github.com/gtsteffaniak/filebrowser/releases/tag/v2.0.0-stable`,
  },
  migrations: {
    up: async ({ effects }) => {
      await convertFileBrowserDatabase(effects)
      await migrateSQLiteConfig(effects)
    },
    down: IMPOSSIBLE,
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
}).satisfies('2.63.23:4')
