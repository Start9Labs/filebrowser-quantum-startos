import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { convertFileBrowserDatabase, migrateSQLiteConfig } from '../utils'
import { switchFromFileBrowser } from './v1.5.8-stable_1-quantum'

export const current = VersionInfo.of({
  version: '#quantum:2.0.2-stable:1',
  releaseNotes: {
    en_US: `The Web Interface health check shows a plain "The web interface is ready" when it passes.

**Updating from Quantum 1.x?** Back up first. The first start imports the old database into SQLite and rebuilds the search index; allow extra time and disk space. Check user permissions and share links afterwards. Downgrading requires restoring a backup.

**Switching from File Browser?** Take a backup first. Files, accounts, passwords and admin rights carry over through an intermediate conversion. Folder restrictions and access rules must be recreated, and old share links stop working. The switch is one-way.`,
    es_ES: `La comprobación de estado de la interfaz web muestra un simple «La interfaz web está lista» cuando pasa.

**¿Actualizas desde Quantum 1.x?** Haz antes una copia de seguridad. El primer inicio importa la base de datos antigua a SQLite y reconstruye el índice de búsqueda; reserva tiempo y espacio adicionales. Revisa después los permisos de usuario y los enlaces de compartición. Para volver atrás hay que restaurar una copia de seguridad.

**¿Vienes de File Browser?** Haz antes una copia de seguridad. Los archivos, cuentas, contraseñas y derechos de administrador se trasladan mediante una conversión intermedia. Debes recrear las restricciones de carpeta y las reglas de acceso; los enlaces antiguos dejan de funcionar. El cambio es irreversible.`,
    de_DE: `Die Zustandsprüfung der Weboberfläche zeigt bei Erfolg schlicht „Die Weboberfläche ist bereit“ an.

**Update von Quantum 1.x?** Erstellen Sie vorher eine Sicherung. Beim ersten Start wird die alte Datenbank in SQLite importiert und der Suchindex neu aufgebaut; planen Sie zusätzliche Zeit und Speicherplatz ein. Prüfen Sie danach Benutzerberechtigungen und Freigabelinks. Eine Rückkehr erfordert das Wiederherstellen einer Sicherung.

**Wechseln Sie von File Browser?** Erstellen Sie vorher eine Sicherung. Dateien, Konten, Passwörter und Administratorrechte werden über eine Zwischenkonvertierung übernommen. Ordnerbeschränkungen und Zugriffsregeln müssen neu eingerichtet werden; alte Freigabelinks funktionieren nicht mehr. Der Wechsel ist endgültig.`,
    pl_PL: `Kontrola stanu interfejsu webowego po pomyślnym przejściu wyświetla po prostu „Interfejs webowy jest gotowy”.

**Aktualizujesz z Quantum 1.x?** Najpierw wykonaj kopię zapasową. Pierwsze uruchomienie importuje starą bazę do SQLite i odbudowuje indeks wyszukiwania; zapewnij dodatkowy czas i miejsce. Sprawdź potem uprawnienia użytkowników i linki udostępniania. Powrót wymaga przywrócenia kopii zapasowej.

**Przechodzisz z File Browser?** Najpierw wykonaj kopię zapasową. Pliki, konta, hasła i uprawnienia administratora są przenoszone przez konwersję pośrednią. Ograniczenia folderów i reguły dostępu trzeba utworzyć ponownie; stare linki udostępniania przestają działać. Przejście jest nieodwracalne.`,
    fr_FR: `La vérification d'état de l'interface web affiche simplement « L’interface web est prête » lorsqu'elle réussit.

**Mise à jour depuis Quantum 1.x ?** Effectuez d'abord une sauvegarde. Le premier démarrage importe l'ancienne base dans SQLite et reconstruit l'index de recherche ; prévoyez du temps et de l'espace supplémentaires. Vérifiez ensuite les permissions et les liens de partage. Revenir en arrière exige de restaurer une sauvegarde.

**Vous basculez depuis File Browser ?** Effectuez d'abord une sauvegarde. Les fichiers, comptes, mots de passe et droits d'administrateur sont repris via une conversion intermédiaire. Les restrictions de dossier et règles d'accès doivent être recréées ; les anciens liens de partage cessent de fonctionner. La bascule est définitive.`,
  },
  migrations: {
    up: async () => {},
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
