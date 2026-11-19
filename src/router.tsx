import { createBrowserRouter, Navigate } from 'react-router'
import { RequireAuth } from './auth/RequireAuth'
import { AppLayout } from './layout/AppLayout'
import { AssetManagement } from './pages/AssetManagement'
import { DefaultDashboard } from './pages/DefaultDashboard'
import { InitializeWizard } from './pages/Initialize'
import { Lightboxes } from './pages/Lightboxes'
import { Login } from './pages/Login'
import { UserManagement } from './pages/UserManagement'
import { WorkspaceManagement } from './pages/WorkspaceManagement'
import { ApplicationStatusDemo } from './pages/mockups/ApplicationStatusDemo'
import { AssetBrowseDemo } from './pages/mockups/AssetBrowseDemo'
import { AssetUploadDemo } from './pages/mockups/AssetUploadDemo'
import { FormControlPalette } from './pages/mockups/FormControlPalette'
import { LifecycleStates } from './pages/mockups/LifecycleStates'
import { LookAndFeel } from './pages/mockups/LookAndFeel'
import { Panels } from './pages/mockups/Panels'
import { RecentActivityDemo } from './pages/mockups/RecentActivityDemo'
import { TitleBarDemo } from './pages/mockups/TitleBarDemo'

export const router = createBrowserRouter([
  // Main application: signed-out visitors go to /login; after signing in, users land on the dashboard.
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: <Login /> },
  // First-time setup. Open to everyone; later an "is initialized" API check will send new installations here.
  { path: '/initialize', element: <InitializeWizard /> },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { path: '/dashboard', element: <DefaultDashboard /> },
      { path: '/users', element: <UserManagement /> },
      { path: '/workspaces', element: <WorkspaceManagement /> },
      { path: '/lightboxes', element: <Lightboxes /> },
      { path: '/assets', element: <AssetManagement /> },
    ],
  },
  // Mockups.
  { path: '/mock/look-and-feel', element: <LookAndFeel /> },
  { path: '/mock/panels', element: <Panels /> },
  { path: '/mock/form-controls', element: <FormControlPalette /> },
  { path: '/mock/title-bar', element: <TitleBarDemo /> },
  { path: '/mock/asset-browse', element: <AssetBrowseDemo /> },
  { path: '/mock/lifecycle-states', element: <LifecycleStates /> },
  { path: '/mock/asset-upload', element: <AssetUploadDemo /> },
  { path: '/mock/recent-activity', element: <RecentActivityDemo /> },
  { path: '/mock/application-status', element: <ApplicationStatusDemo /> },
])
