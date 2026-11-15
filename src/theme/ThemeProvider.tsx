import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext } from './ThemeContext'
import { DEFAULT_THEME, isThemeId, type ThemeId } from './themes'

const STORAGE_KEY = 'dam-ui.theme'

function readStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isThemeId(stored) ? stored : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

/**
 * Applies the theme to <html> right away (not in an effect) so components that
 * read CSS variables during render, such as charts, see the new theme's values.
 */
function applyTheme(theme: ThemeId) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage can be unavailable (private mode); the theme still applies for this session.
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const initial = readStoredTheme()
    applyTheme(initial)
    return initial
  })

  const setTheme = useCallback((next: ThemeId) => {
    applyTheme(next)
    setThemeState(next)
  }, [])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
