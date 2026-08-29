import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

const dockerImage = 'gtstef/filebrowser'
const dockerVersion = '1.5.4-stable'

export const manifest = setupManifest({
  id: 'filebrowser',
  title: 'FileBrowser Quantum',
  license: 'Apache-2.0',
  packageRepo: 'https://github.com/Start9Labs/filebrowser-quantum-startos',
  upstreamRepo: 'https://github.com/gtsteffaniak/filebrowser',
  marketingUrl: 'https://filebrowserquantum.com/',
  donationUrl: null,
  description: { short, long },
  // `data` is load-bearing: eight sibling packages mount it by name.
  volumes: ['data', 'database', 'config', 'cache'],
  images: {
    filebrowser: {
      source: {
        dockerTag: `${dockerImage}:${dockerVersion}`,
      },
      arch: ['x86_64', 'aarch64'],
    },
  },
  dependencies: {},
})
