import { MOCK_ACCOUNT } from './mockCredentials'

/** The signed-in user. */
export interface AuthUser {
  username: string
  displayName: string
}

/** Thrown when the user name or password is wrong. */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('The user name or password is incorrect.')
    this.name = 'InvalidCredentialsError'
  }
}

const LATENCY_MS = 800
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Emulates the login call to the API. Replace the body with a real request (e.g. POST /auth/login)
 * once the API has authentication; callers only depend on the signature.
 */
export async function login(username: string, password: string): Promise<AuthUser> {
  await delay(LATENCY_MS)
  // User names ignore case and surrounding spaces; passwords must match exactly.
  if (username.trim().toLowerCase() !== MOCK_ACCOUNT.username || password !== MOCK_ACCOUNT.password) {
    throw new InvalidCredentialsError()
  }
  return { username: MOCK_ACCOUNT.username, displayName: MOCK_ACCOUNT.displayName }
}

/** Emulates ending the session on the server. */
export async function logout(): Promise<void> {
  await delay(200)
}
