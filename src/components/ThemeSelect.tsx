import { useTheme } from '../theme/useTheme'
import { THEMES, isThemeId } from '../theme/themes'
import './ThemeSelect.css'

export function ThemeSelect() {
  const { theme, setTheme } = useTheme()

  return (
    <label className="theme-select">
      <span className="theme-select__label">Theme</span>
      <select
        value={theme}
        onChange={(event) => {
          if (isThemeId(event.target.value)) setTheme(event.target.value)
        }}
      >
        {THEMES.map(({ id, label }) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
    </label>
  )
}
