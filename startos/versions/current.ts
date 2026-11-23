import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import {
  convertFileBrowserDatabase,
  migrateSQLiteConfig,
  moveUnderDataFolder,
} from '../utils'
import { switchFromFileBrowser } from './v1.5.8-stable_1-quantum'

export const current = VersionInfo.of({
  version: '#quantum:2.0.2-stable:5',
  releaseNotes: {
    en_US:
      'Requires StartOS 0.4.3 or later. **Your files now sit one level down, in a folder called Data.** Shared volumes you grant to FileBrowser Quantum in StartOS appear as folders beside it, and nothing can be created at that top level. Accounts limited to a folder, share links, access rules and pinned items are carried over and keep pointing at the same files. Accounts that could see everything still can, which now includes any shared volume you grant. WebDAV connections, bookmarks and scripts must add /Data to their paths. Search results are incomplete for a while after updating, while the index is rebuilt.',
    es_ES:
      'Requiere StartOS 0.4.3 o posterior. **Tus archivos están ahora un nivel más abajo, en una carpeta llamada Data.** Los volúmenes compartidos que concedas a FileBrowser Quantum en StartOS aparecen como carpetas junto a ella, y no se puede crear nada en ese nivel superior. Las cuentas limitadas a una carpeta, los enlaces de compartición, las reglas de acceso y los elementos fijados se conservan y siguen apuntando a los mismos archivos. Las cuentas que podían verlo todo siguen pudiendo, lo que ahora incluye cualquier volumen compartido que concedas. Las conexiones WebDAV, los marcadores y los scripts deben añadir /Data a sus rutas. Los resultados de búsqueda estarán incompletos durante un tiempo tras actualizar, mientras se reconstruye el índice.',
    de_DE:
      'Erfordert StartOS 0.4.3 oder neuer. **Ihre Dateien liegen jetzt eine Ebene tiefer, in einem Ordner namens Data.** Geteilte Volumes, die Sie FileBrowser Quantum in StartOS freigeben, erscheinen als Ordner daneben, und auf dieser obersten Ebene kann nichts angelegt werden. Auf einen Ordner beschränkte Konten, Freigabelinks, Zugriffsregeln und angeheftete Elemente werden übernommen und zeigen weiter auf dieselben Dateien. Konten, die alles sehen konnten, können das weiterhin – das schließt nun jedes freigegebene geteilte Volume ein. WebDAV-Verbindungen, Lesezeichen und Skripte müssen ihren Pfaden /Data hinzufügen. Suchergebnisse sind nach dem Update eine Zeit lang unvollständig, während der Index neu aufgebaut wird.',
    pl_PL:
      'Wymaga StartOS 0.4.3 lub nowszego. **Twoje pliki znajdują się teraz poziom niżej, w folderze o nazwie Data.** Woluminy współdzielone, do których przyznasz FileBrowser Quantum dostęp w StartOS, pojawiają się jako foldery obok niego, a na tym najwyższym poziomie nie można niczego tworzyć. Konta ograniczone do folderu, linki udostępniania, reguły dostępu i przypięte elementy zostają przeniesione i nadal wskazują te same pliki. Konta, które widziały wszystko, nadal widzą wszystko, co teraz obejmuje każdy przyznany wolumin współdzielony. Połączenia WebDAV, zakładki i skrypty muszą dodać /Data do swoich ścieżek. Po aktualizacji wyniki wyszukiwania są przez pewien czas niepełne, dopóki indeks nie zostanie odbudowany.',
    fr_FR:
      'Nécessite StartOS 0.4.3 ou une version ultérieure. **Vos fichiers se trouvent désormais un niveau plus bas, dans un dossier nommé Data.** Les volumes partagés que vous accordez à FileBrowser Quantum dans StartOS apparaissent comme des dossiers à côté, et rien ne peut être créé à ce niveau supérieur. Les comptes limités à un dossier, les liens de partage, les règles d’accès et les éléments épinglés sont repris et pointent toujours vers les mêmes fichiers. Les comptes qui pouvaient tout voir le peuvent toujours, ce qui inclut désormais tout volume partagé accordé. Les connexions WebDAV, les favoris et les scripts doivent ajouter /Data à leurs chemins. Les résultats de recherche restent incomplets quelque temps après la mise à jour, pendant la reconstruction de l’index.',
  },
  migrations: {
    up: async ({ effects }) => moveUnderDataFolder(effects),
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
