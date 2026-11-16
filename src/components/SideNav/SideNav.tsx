import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { CollapseIcon, ExpandIcon } from './icons'
import './SideNav.css'

export interface SideNavItem {
  to: string
  label: string
  icon: ReactNode
}

export interface SideNavProps {
  items: SideNavItem[]
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  label?: string
}

/** Left-hand menu. Expanded it shows icons and labels; collapsed, icons only (labels become tooltips). */
export function SideNav({ items, collapsed, onCollapsedChange, label = 'Main' }: SideNavProps) {
  return (
    <nav className={`sidenav${collapsed ? ' sidenav--collapsed' : ''}`} aria-label={label}>
      <ul className="sidenav__list">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) => `sidenav__link${isActive ? ' sidenav__link--active' : ''}`}
              // Collapsed, the label is hidden, so name the link and show a tooltip.
              aria-label={collapsed ? item.label : undefined}
              title={collapsed ? item.label : undefined}
            >
              <span className="sidenav__icon">{item.icon}</span>
              <span className="sidenav__label">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="sidenav__toggle"
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
        title={collapsed ? 'Expand menu' : 'Collapse menu'}
        onClick={() => onCollapsedChange(!collapsed)}
      >
        <span className="sidenav__icon">{collapsed ? <ExpandIcon /> : <CollapseIcon />}</span>
        <span className="sidenav__label">Collapse</span>
      </button>
    </nav>
  )
}
