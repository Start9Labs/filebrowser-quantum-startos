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
  version: '#quantum:1.5.4:0',
  releaseNotes: {
    en_US: `Updated FileBrowser Quantum to 1.5.4, which fixes a high-severity security issue.

- Previewing a malicious HTML file could run scripts against your session. Previews are now isolated from the rest of the app and the session cookie is no longer readable by page scripts (GHSA-vvm6-jwrf-hgmg).
- Subtitles load again on public video shares.
- Setting the upload chunk size to 0 disables chunking again, which works around stalled uploads from iOS 26 devices.
- The "Install App" prompt now stays dismissed once you clear it.
- The bundled ffmpeg was updated to 9.0.1.

Full upstream release notes: https://github.com/gtsteffaniak/filebrowser/releases/tag/v1.5.4-stable

**Switching from File Browser?** Your files, your user accounts and everyone's existing passwords carry over — Quantum reads the File Browser database directly and converts it. The switch is one-way, because File Browser is end of life, so take a StartOS backup first. Two things do not carry over: per-user folder restrictions are lost, so re-check every restricted account afterwards, and existing share links stop working and must be re-created.`,
    es_ES: `FileBrowser Quantum se ha actualizado a la versión 1.5.4, que corrige un problema de seguridad de gravedad alta.

- La vista previa de un archivo HTML malicioso podía ejecutar scripts contra tu sesión. Las vistas previas ahora están aisladas del resto de la aplicación y la cookie de sesión ya no puede leerse desde los scripts de la página (GHSA-vvm6-jwrf-hgmg).
- Los subtítulos vuelven a cargarse en los recursos compartidos de vídeo públicos.
- Establecer el tamaño de fragmento de subida en 0 vuelve a desactivar la fragmentación, lo que evita las subidas bloqueadas desde dispositivos con iOS 26.
- El aviso «Instalar aplicación» ya no reaparece después de descartarlo.
- La versión de ffmpeg incluida se ha actualizado a la 9.0.1.

Notas de la versión completas: https://github.com/gtsteffaniak/filebrowser/releases/tag/v1.5.4-stable

**¿Vienes de File Browser?** Tus archivos, tus cuentas de usuario y las contraseñas existentes se conservan: Quantum lee directamente la base de datos de File Browser y la convierte. El cambio es irreversible, porque File Browser ha llegado al final de su vida útil, así que haz antes una copia de seguridad de StartOS. Dos cosas no se trasladan: se pierden las restricciones de carpeta por usuario, así que revisa después todas las cuentas restringidas, y los enlaces de compartición existentes dejan de funcionar y hay que volver a crearlos.`,
    de_DE: `FileBrowser Quantum wurde auf 1.5.4 aktualisiert, womit eine Sicherheitslücke hoher Schwere behoben wird.

- Die Vorschau einer bösartigen HTML-Datei konnte Skripte in Ihrer Sitzung ausführen. Vorschauen sind jetzt vom Rest der Anwendung isoliert, und Skripte auf der Seite können das Sitzungs-Cookie nicht mehr auslesen (GHSA-vvm6-jwrf-hgmg).
- Untertitel werden in öffentlichen Video-Freigaben wieder geladen.
- Eine Upload-Blockgröße von 0 deaktiviert die Aufteilung wieder, was hängende Uploads von Geräten mit iOS 26 umgeht.
- Der Hinweis „App installieren“ bleibt nach dem Ausblenden ausgeblendet.
- Das mitgelieferte ffmpeg wurde auf 9.0.1 aktualisiert.

Vollständige Versionshinweise: https://github.com/gtsteffaniak/filebrowser/releases/tag/v1.5.4-stable

**Wechseln Sie von File Browser?** Ihre Dateien, Ihre Benutzerkonten und alle vorhandenen Passwörter bleiben erhalten — Quantum liest die File-Browser-Datenbank direkt und konvertiert sie. Der Wechsel ist endgültig, denn File Browser wird nicht mehr gepflegt; erstellen Sie vorher eine StartOS-Sicherung. Zwei Dinge werden nicht übernommen: benutzerbezogene Ordnerbeschränkungen gehen verloren, prüfen Sie danach jedes eingeschränkte Konto, und bestehende Freigabelinks funktionieren nicht mehr und müssen neu erstellt werden.`,
    pl_PL: `FileBrowser Quantum został zaktualizowany do wersji 1.5.4, która usuwa lukę bezpieczeństwa o wysokiej istotności.

- Podgląd złośliwego pliku HTML mógł uruchomić skrypty w kontekście Twojej sesji. Podglądy są teraz odizolowane od reszty aplikacji, a skrypty strony nie mogą już odczytać ciasteczka sesji (GHSA-vvm6-jwrf-hgmg).
- Napisy ponownie wczytują się w publicznych udostępnieniach wideo.
- Ustawienie rozmiaru fragmentu wysyłki na 0 znów wyłącza dzielenie na fragmenty, co omija zawieszone wysyłki z urządzeń z iOS 26.
- Komunikat „Zainstaluj aplikację” pozostaje ukryty po jego zamknięciu.
- Dołączony ffmpeg został zaktualizowany do wersji 9.0.1.

Pełne informacje o wydaniu: https://github.com/gtsteffaniak/filebrowser/releases/tag/v1.5.4-stable

**Przechodzisz z File Browser?** Twoje pliki, konta użytkowników i istniejące hasła zostaną zachowane — Quantum odczytuje bazę danych File Browser bezpośrednio i konwertuje ją. Przejście jest nieodwracalne, ponieważ File Browser nie jest już rozwijany, więc najpierw wykonaj kopię zapasową StartOS. Dwie rzeczy nie zostaną przeniesione: ograniczenia folderów przypisane do użytkowników zostaną utracone, więc sprawdź potem każde konto z ograniczeniami, a istniejące linki udostępniania przestaną działać i trzeba je utworzyć na nowo.`,
    fr_FR: `FileBrowser Quantum a été mis à jour vers la version 1.5.4, qui corrige une faille de sécurité de gravité élevée.

- L'aperçu d'un fichier HTML malveillant pouvait exécuter des scripts dans votre session. Les aperçus sont désormais isolés du reste de l'application et le cookie de session n'est plus lisible par les scripts de la page (GHSA-vvm6-jwrf-hgmg).
- Les sous-titres se chargent de nouveau dans les partages vidéo publics.
- Définir la taille de fragment d'envoi à 0 désactive de nouveau le découpage, ce qui contourne les envois bloqués depuis les appareils sous iOS 26.
- Le message « Installer l'application » reste masqué une fois que vous l'avez fermé.
- La version de ffmpeg incluse a été mise à jour vers la 9.0.1.

Notes de version complètes : https://github.com/gtsteffaniak/filebrowser/releases/tag/v1.5.4-stable

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
