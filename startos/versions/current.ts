import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { convertFileBrowserDatabase, migrateSQLiteConfig } from '../utils'
import { switchFromFileBrowser } from './v1.5.8-stable_1-quantum'

export const current = VersionInfo.of({
  version: '#quantum:2.1.0-stable:0',
  releaseNotes: {
    en_US: `Updated FileBrowser Quantum to 2.1.0.

**Security**

- Fixes several high and moderate severity issues where symbolic links could be used to escape a folder, overwrite files outside it, or bypass access rules

**Features**

- Storage quotas per folder, source, user and share
- Richer editor with a toolbar, live split-view Markdown preview, and math and chemistry formulas
- User groups managed from the web interface
- Synced lyrics and subtitles for audio, new file templates, Date added and Type columns, and chunked uploads for large files

[Full release notes](https://github.com/gtsteffaniak/filebrowser/releases/tag/v2.1.0-stable)`,
    es_ES: `FileBrowser Quantum actualizado a 2.1.0.

**Seguridad**

- Corrige varios problemas de gravedad alta y moderada en los que los enlaces simbólicos permitían salir de una carpeta, sobrescribir archivos fuera de ella o eludir las reglas de acceso

**Novedades**

- Cuotas de almacenamiento por carpeta, origen, usuario y enlace compartido
- Editor mejorado con barra de herramientas, vista dividida con vista previa de Markdown en vivo y fórmulas matemáticas y químicas
- Grupos de usuarios gestionados desde la interfaz web
- Letras y subtítulos sincronizados para audio, plantillas de archivos nuevos, columnas Fecha de adición y Tipo, y subida por fragmentos de archivos grandes

[Notas completas de la versión](https://github.com/gtsteffaniak/filebrowser/releases/tag/v2.1.0-stable)`,
    de_DE: `FileBrowser Quantum auf 2.1.0 aktualisiert.

**Sicherheit**

- Behebt mehrere Schwachstellen hoher und mittlerer Schwere, bei denen symbolische Links genutzt werden konnten, um einen Ordner zu verlassen, Dateien außerhalb davon zu überschreiben oder Zugriffsregeln zu umgehen

**Neuerungen**

- Speicherkontingente pro Ordner, Quelle, Benutzer und Freigabe
- Erweiterter Editor mit Werkzeugleiste, geteilter Live-Vorschau für Markdown sowie Mathematik- und Chemieformeln
- Benutzergruppen über die Weboberfläche verwalten
- Synchronisierte Liedtexte und Untertitel für Audio, Vorlagen für neue Dateien, Spalten „Hinzugefügt am“ und „Typ“ sowie Uploads großer Dateien in Teilstücken

[Vollständige Versionshinweise](https://github.com/gtsteffaniak/filebrowser/releases/tag/v2.1.0-stable)`,
    pl_PL: `Zaktualizowano FileBrowser Quantum do wersji 2.1.0.

**Bezpieczeństwo**

- Naprawia kilka problemów o wysokiej i średniej wadze, w których dowiązania symboliczne pozwalały wyjść poza folder, nadpisać pliki poza nim lub obejść reguły dostępu

**Nowości**

- Limity miejsca dla folderów, źródeł, użytkowników i udostępnień
- Rozbudowany edytor z paskiem narzędzi, podzielonym widokiem z podglądem Markdown na żywo oraz wzorami matematycznymi i chemicznymi
- Grupy użytkowników zarządzane z interfejsu WWW
- Synchronizowane teksty i napisy do plików audio, szablony nowych plików, kolumny Data dodania i Typ oraz wysyłanie dużych plików w częściach

[Pełne informacje o wydaniu](https://github.com/gtsteffaniak/filebrowser/releases/tag/v2.1.0-stable)`,
    fr_FR: `FileBrowser Quantum mis à jour vers 2.1.0.

**Sécurité**

- Corrige plusieurs failles de gravité élevée et modérée par lesquelles des liens symboliques permettaient de sortir d’un dossier, d’écraser des fichiers hors de celui-ci ou de contourner les règles d’accès

**Nouveautés**

- Quotas de stockage par dossier, source, utilisateur et partage
- Éditeur enrichi avec barre d’outils, vue partagée avec aperçu Markdown en direct et formules mathématiques et chimiques
- Groupes d’utilisateurs gérés depuis l’interface web
- Paroles et sous-titres synchronisés pour l’audio, modèles de nouveaux fichiers, colonnes Date d’ajout et Type, et envoi par morceaux des gros fichiers

[Notes de version complètes](https://github.com/gtsteffaniak/filebrowser/releases/tag/v2.1.0-stable)`,
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
