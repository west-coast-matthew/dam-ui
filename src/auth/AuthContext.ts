import { createContext } from 'react'
import type { AuthUser } from '../services/authService'

export interface AuthContextValue {
  /** Null when nobody is signed in. */
  user: AuthUser | null
  /** Rejects with InvalidCredentialsError on a wrong user name or password. */
  signIn: (username: string, password: string) => Promise<AuthUser>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
