import { useState } from 'react'
import { Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { useLogout } from '../auth/useLogout'
import { SideNav, type SideNavItem } from '../components/SideNav'
import { AssetsIcon, CategoriesIcon, DashboardIcon, InitializeIcon, LightboxIcon, UsersIcon, WorkspacesIcon } from '../components/SideNav/icons'
import { TitleBar } from '../components/TitleBar'
import './AppLayout.css'

const COLLAPSED_KEY = 'dam-ui.nav-collapsed'

const NAV_ITEMS: SideNavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/users', label: 'User management', icon: <UsersIcon /> },
  { to: '/workspaces', label: 'Workspaces', icon: <WorkspacesIcon /> },
  { to: '/categories', label: 'Categories', icon: <CategoriesIcon /> },
  { to: '/lightboxes', label: 'Lightboxes', icon: <LightboxIcon /> },
  { to: '/assets', label: 'Asset management', icon: <AssetsIcon /> },
  // Temporary: until the app detects a new installation itself, the setup wizard is reached from here.
  { to: '/initialize', label: 'Initialize', icon: <InitializeIcon /> },
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
  const { user } = useAuth()
  const logOut = useLogout()

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
      {/* RequireAuth guarantees a user here. */}
      <TitleBar userName={user?.displayName ?? ''} onLogout={logOut} />
      <div className="app__body">
        <SideNav items={NAV_ITEMS} collapsed={collapsed} onCollapsedChange={changeCollapsed} />
        <main className="app__content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
