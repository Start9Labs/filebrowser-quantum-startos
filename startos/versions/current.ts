import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { convertFileBrowserDatabase, migrateSQLiteConfig } from '../utils'
import { switchFromFileBrowser } from './v1.5.8-stable_1-quantum'

export const current = VersionInfo.of({
  version: '#quantum:2.0.2-stable:0',
  releaseNotes: {
    en_US: `Updated FileBrowser Quantum to 2.0.2-stable. Fixes API token permission enforcement, stored XSS in File Size Analyzer, passkey protection, share access and WebDAV create permissions, plus realtime connection crashes and cross-user duplicate-search results. Also fixes WebP previews, tar hard-link extraction and upload navigation warnings.

**Updating from Quantum 1.x?** Back up first. The first start imports the old database into SQLite and rebuilds the search index; allow extra time and disk space. Check user permissions and share links afterwards. Downgrading requires restoring a backup.

**Switching from File Browser?** Take a backup first. Files, accounts, passwords and admin rights carry over through an intermediate conversion. Folder restrictions and access rules must be recreated, and old share links stop working. The switch is one-way.

Full upstream release notes: https://github.com/gtsteffaniak/filebrowser/releases/tag/v2.0.2-stable`,
    es_ES: `FileBrowser Quantum se ha actualizado a 2.0.2-stable. Corrige la aplicación de permisos de tokens API, XSS persistente en el analizador de tamaño, la protección de claves de acceso, el acceso compartido y los permisos de creación en WebDAV, además de fallos de conexiones en tiempo real y resultados de búsqueda de duplicados entre usuarios. También corrige vistas previas WebP, extracción de enlaces duros tar y avisos de navegación durante subidas.

**¿Actualizas desde Quantum 1.x?** Haz antes una copia de seguridad. El primer inicio importa la base de datos antigua a SQLite y reconstruye el índice de búsqueda; reserva tiempo y espacio adicionales. Revisa después los permisos de usuario y los enlaces de compartición. Para volver atrás hay que restaurar una copia de seguridad.

**¿Vienes de File Browser?** Haz antes una copia de seguridad. Los archivos, cuentas, contraseñas y derechos de administrador se trasladan mediante una conversión intermedia. Debes recrear las restricciones de carpeta y las reglas de acceso; los enlaces antiguos dejan de funcionar. El cambio es irreversible.

Notas completas de la versión: https://github.com/gtsteffaniak/filebrowser/releases/tag/v2.0.2-stable`,
    de_DE: `FileBrowser Quantum wurde auf 2.0.2-stable aktualisiert. Behebt Fehler bei API-Token-Berechtigungen, gespeichertes XSS in der Speicherplatzanalyse, Passkey-Schutz, Freigabezugriff und WebDAV-Erstellungsrechte sowie Abstürze bei Echtzeitverbindungen und benutzerübergreifende Duplikat-Suchergebnisse. Korrigiert außerdem WebP-Vorschauen, das Entpacken von tar-Hardlinks und Navigationswarnungen bei Uploads.

**Update von Quantum 1.x?** Erstellen Sie vorher eine Sicherung. Beim ersten Start wird die alte Datenbank in SQLite importiert und der Suchindex neu aufgebaut; planen Sie zusätzliche Zeit und Speicherplatz ein. Prüfen Sie danach Benutzerberechtigungen und Freigabelinks. Eine Rückkehr erfordert das Wiederherstellen einer Sicherung.

**Wechseln Sie von File Browser?** Erstellen Sie vorher eine Sicherung. Dateien, Konten, Passwörter und Administratorrechte werden über eine Zwischenkonvertierung übernommen. Ordnerbeschränkungen und Zugriffsregeln müssen neu eingerichtet werden; alte Freigabelinks funktionieren nicht mehr. Der Wechsel ist endgültig.

Vollständige Versionshinweise: https://github.com/gtsteffaniak/filebrowser/releases/tag/v2.0.2-stable`,
    pl_PL: `FileBrowser Quantum został zaktualizowany do 2.0.2-stable. Naprawia egzekwowanie uprawnień tokenów API, trwały XSS w analizatorze rozmiaru plików, ochronę kluczy dostępu, dostęp do udostępnień i uprawnienia tworzenia w WebDAV, a także awarie połączeń czasu rzeczywistego i wyniki wyszukiwania duplikatów ujawniane między użytkownikami. Poprawia też podglądy WebP, rozpakowywanie dowiązań twardych tar i ostrzeżenia przed nawigacją podczas wysyłania.

**Aktualizujesz z Quantum 1.x?** Najpierw wykonaj kopię zapasową. Pierwsze uruchomienie importuje starą bazę do SQLite i odbudowuje indeks wyszukiwania; zapewnij dodatkowy czas i miejsce. Sprawdź potem uprawnienia użytkowników i linki udostępniania. Powrót wymaga przywrócenia kopii zapasowej.

**Przechodzisz z File Browser?** Najpierw wykonaj kopię zapasową. Pliki, konta, hasła i uprawnienia administratora są przenoszone przez konwersję pośrednią. Ograniczenia folderów i reguły dostępu trzeba utworzyć ponownie; stare linki udostępniania przestają działać. Przejście jest nieodwracalne.

Pełne informacje o wydaniu: https://github.com/gtsteffaniak/filebrowser/releases/tag/v2.0.2-stable`,
    fr_FR: `FileBrowser Quantum a été mis à jour vers 2.0.2-stable. Corrige l'application des permissions des jetons API, une faille XSS persistante dans l'analyseur de taille, la protection des clés d'accès, l'accès aux partages et les droits de création WebDAV, ainsi que des plantages des connexions temps réel et des résultats de recherche de doublons divulgués entre utilisateurs. Corrige aussi les aperçus WebP, l'extraction des liens physiques tar et les avertissements de navigation pendant les envois.

**Mise à jour depuis Quantum 1.x ?** Effectuez d'abord une sauvegarde. Le premier démarrage importe l'ancienne base dans SQLite et reconstruit l'index de recherche ; prévoyez du temps et de l'espace supplémentaires. Vérifiez ensuite les permissions et les liens de partage. Revenir en arrière exige de restaurer une sauvegarde.

**Vous basculez depuis File Browser ?** Effectuez d'abord une sauvegarde. Les fichiers, comptes, mots de passe et droits d'administrateur sont repris via une conversion intermédiaire. Les restrictions de dossier et règles d'accès doivent être recréées ; les anciens liens de partage cessent de fonctionner. La bascule est définitive.

Notes de version complètes : https://github.com/gtsteffaniak/filebrowser/releases/tag/v2.0.2-stable`,
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
