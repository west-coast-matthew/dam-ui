import { useMemo, useState, type ReactNode } from 'react'
import * as authService from '../services/authService'
import type { AuthUser } from '../services/authService'
import { AuthContext, type AuthContextValue } from './AuthContext'

/** The session lasts for the browser tab, so a reload keeps you signed in but closing the tab doesn't. */
const SESSION_KEY = 'dam-ui.session'

function readSession(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AuthUser>
    return typeof parsed.username === 'string' && typeof parsed.displayName === 'string'
      ? { username: parsed.username, displayName: parsed.displayName }
      : null
  } catch {
    return null
  }
}

function writeSession(user: AuthUser | null) {
  try {
    if (user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // Storage unavailable: the session just won't survive a reload.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readSession)

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signIn: async (username, password) => {
        const signedIn = await authService.login(username, password)
        writeSession(signedIn)
        setUser(signedIn)
        return signedIn
      },
      signOut: async () => {
        // Always end the session locally, even if the server call fails.
        try {
          await authService.logout()
        } finally {
          writeSession(null)
          setUser(null)
        }
      },
    }),
    [user],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
