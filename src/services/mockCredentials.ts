/**
 * The one account the mock auth service accepts, until the app has real security.
 * Hard-coded on purpose (spec 003); these are not real credentials.
 */
export const MOCK_ACCOUNT = {
  username: 'alex',
  password: 'dam-demo',
  displayName: 'Alex Morgan',
} as const
