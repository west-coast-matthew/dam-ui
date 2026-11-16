import { useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from './useAuth'

/** Where log out takes the user, for now. */
export const LOGGED_OUT_PATH = '/login'

/**
 * Returns a function that ends the session and sends the user to the login page.
 * Every log out control should use this, so they all behave the same way.
 */
export function useLogout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const pending = useRef(false)

  return useCallback(async () => {
    if (pending.current) return // ignore double clicks
    pending.current = true
    try {
      await signOut()
    } catch (error) {
      // The local session is cleared either way; a failed server call shouldn't trap the user.
      console.warn('[useLogout] sign out failed', error)
    } finally {
      pending.current = false
      navigate(LOGGED_OUT_PATH, { replace: true })
    }
  }, [signOut, navigate])
}
