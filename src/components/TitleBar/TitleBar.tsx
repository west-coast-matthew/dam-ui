import { useState } from 'react'
import { Menu, MenuGroup, MenuHeader, MenuItem, MenuItemRadio, MenuSeparator } from '../Menu'
import { THEMES } from '../../theme/themes'
import { useTheme } from '../../theme/useTheme'
import { useWorkspace } from '../../workspace/useWorkspace'
import { NewWorkspaceDialog } from './NewWorkspaceDialog'
import { TitleBarIcon } from './icons'
import './TitleBar.css'

export interface TitleBarProps {
  /** Display name of the signed-in user. */
  userName: string
  onLogout: () => void
}

/**
 * Application title bar: product name, top-level menus (Workspaces for now) and
 * the signed-in user's settings and log out controls.
 */
export function TitleBar({ userName, onLogout }: TitleBarProps) {
  const { theme, setTheme } = useTheme()
  const { workspaces, current, selectWorkspace, createWorkspace } = useWorkspace()
  const [creating, setCreating] = useState(false)

  return (
    <header className="titlebar">
      <div className="titlebar__brand">
        <span className="titlebar__logo" aria-hidden="true">
          <TitleBarIcon name="layers" size={20} />
        </span>
        <span className="titlebar__title">
          <span className="titlebar__title-full">Digital Asset Management</span>
          <abbr className="titlebar__title-short" title="Digital Asset Management">DAM</abbr>
        </span>
      </div>

      <nav className="titlebar__nav" aria-label="Main">
        <ul>
          <li>
            <Menu
              triggerClassName="titlebar__menu-button"
              trigger={
                <>
                  <span>Workspaces</span>
                  <span className="titlebar__current">{current.name}</span>
                  <TitleBarIcon name="chevron" size={14} />
                </>
              }
            >
              <MenuGroup label="Switch workspace">
                {workspaces.map((w) => (
                  <MenuItemRadio key={w.id} checked={w.id === current.id} onSelect={() => selectWorkspace(w.id)}>
                    {w.name}
                  </MenuItemRadio>
                ))}
              </MenuGroup>
              <MenuSeparator />
              <MenuItem icon={<TitleBarIcon name="plus" size={16} />} onSelect={() => setCreating(true)}>
                New workspace…
              </MenuItem>
            </Menu>
          </li>
        </ul>
      </nav>

      <div className="titlebar__user">
        <span className="titlebar__signed-in">
          Signed in as <strong>{userName}</strong>
        </span>
        <Menu label="User settings" align="end" triggerClassName="titlebar__icon-button" trigger={<TitleBarIcon name="settings" />}>
          <MenuHeader>
            Signed in as
            <strong>{userName}</strong>
          </MenuHeader>
          <MenuGroup label="Theme">
            {THEMES.map((t) => (
              <MenuItemRadio key={t.id} checked={t.id === theme} onSelect={() => setTheme(t.id)}>
                {t.label}
              </MenuItemRadio>
            ))}
          </MenuGroup>
        </Menu>
        <button type="button" className="titlebar__icon-button" aria-label="Log out" title="Log out" onClick={onLogout}>
          <TitleBarIcon name="logout" />
        </button>
      </div>

      <NewWorkspaceDialog
        open={creating}
        existingNames={workspaces.map((w) => w.name)}
        onClose={() => setCreating(false)}
        onCreate={(name) => {
          createWorkspace(name)
          setCreating(false)
        }}
      />
    </header>
  )
}
