import { useMemo } from 'react'
import { useTheme } from './useTheme'

/** Reads the active theme's CSS colour variables, e.g. useThemeTokens(['--color-text']). */
export function useThemeTokens<const T extends readonly string[]>(names: T): Record<T[number], string> {
  const { theme } = useTheme()
  const key = names.join(',')
  return useMemo(() => {
    // `theme` keys the memo so the values are re-read whenever the theme changes.
    void theme
    const styles = getComputedStyle(document.documentElement)
    return Object.fromEntries(
      key.split(',').map((name) => [name, styles.getPropertyValue(name).trim()]),
    ) as Record<T[number], string>
  }, [key, theme])
}
