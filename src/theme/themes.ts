export const THEMES = [
  { id: 'white', label: 'White' },
  { id: 'blue', label: 'Blue' },
  { id: 'dark', label: 'Dark' },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

export const DEFAULT_THEME: ThemeId = 'white'

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value)
}
