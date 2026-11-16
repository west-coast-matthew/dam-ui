import { useState } from 'react'
import { Outlet } from 'react-router'
import { SideNav, type SideNavItem } from '../components/SideNav'
import { AssetsIcon, DashboardIcon, LightboxIcon, UsersIcon } from '../components/SideNav/icons'
import { TitleBar } from '../components/TitleBar'
import './AppLayout.css'

/** Until login (spec 003) exists, the signed-in user is mocked. */
const MOCK_USER = 'Alex Morgan'
const COLLAPSED_KEY = 'dam-ui.nav-collapsed'

const NAV_ITEMS: SideNavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/users', label: 'User management', icon: <UsersIcon /> },
  { to: '/lightboxes', label: 'Lightboxes', icon: <LightboxIcon /> },
  { to: '/assets', label: 'Asset management', icon: <AssetsIcon /> },
]

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

/** Main application shell: title bar on top, collapsible menu on the left, the selected page on the right. */
export function AppLayout() {
  const [collapsed, setCollapsed] = useState(readCollapsed)

  const changeCollapsed = (next: boolean) => {
    setCollapsed(next)
    try {
      localStorage.setItem(COLLAPSED_KEY, String(next))
    } catch {
      // Storage can be unavailable (private mode); the menu still works for this visit.
    }
  }

  return (
    <div className="app">
      <TitleBar userName={MOCK_USER} onLogout={() => console.log('[AppLayout] onLogout (login not built yet)')} />
      <div className="app__body">
        <SideNav items={NAV_ITEMS} collapsed={collapsed} onCollapsedChange={changeCollapsed} />
        <main className="app__content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
