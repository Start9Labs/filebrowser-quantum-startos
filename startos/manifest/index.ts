import { setupManifest } from '@start9labs/start-sdk'
import { long, short, switchAlert } from './i18n'

const dockerImage = 'gtstef/filebrowser'
const dockerVersion = '1.5.8-stable'

export const manifest = setupManifest({
  id: 'filebrowser',
  title: 'FileBrowser Quantum',
  license: 'Apache-2.0',
  packageRepo: 'https://github.com/Start9Labs/filebrowser-quantum-startos',
  upstreamRepo: 'https://github.com/gtsteffaniak/filebrowser',
  marketingUrl: 'https://filebrowserquantum.com/',
  donationUrl: null,
  description: { short, long },
  preDownloadAlert: {
    message: switchAlert,
    when: { sourceVersion: '^2' },
  },
  // `data` is load-bearing: eight sibling packages mount it by name. `main` is
  // where a File Browser converted from StartOS 0.3.5.1 keeps its data.
  volumes: ['data', 'database', 'config', 'cache', 'main'],
  images: {
    filebrowser: {
      source: {
        dockerTag: `${dockerImage}:${dockerVersion}`,
      },
      arch: ['x86_64', 'aarch64'],
    },
  },
})
