export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting FileBrowser Quantum': 0,
  'Web Interface': 1,
  'The web interface is ready': 2,
  'The web interface is not ready': 3,

  // interfaces.ts
  'Web UI': 4,
  'The web interface of FileBrowser Quantum': 5,

  // actions/setAdminPassword.ts
  'Set Admin Password': 6,
  'Create or reset your admin user and password': 7,
  'Success!': 8,
  'Your admin username and password are below. Write them down or save them to a password manager.': 9,
  Username: 10,
  Password: 11,

  // actions/setExpiration.ts
  'Session Timeout': 12,
  'The length of time (in hours) before a browser session will be automatically terminated': 13,
  hours: 14,
  'Set Session Timeout': 15,
  'Determine how long a browser session lasts before it is automatically terminated': 16,

  // init/watchCredentials.ts
  'Create your admin user password': 17,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
