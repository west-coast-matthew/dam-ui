import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from './layout/AppLayout'
import { AssetManagement } from './pages/AssetManagement'
import { DefaultDashboard } from './pages/DefaultDashboard'
import { Lightboxes } from './pages/Lightboxes'
import { UserManagement } from './pages/UserManagement'
import { AssetBrowseDemo } from './pages/mockups/AssetBrowseDemo'
import { AssetUploadDemo } from './pages/mockups/AssetUploadDemo'
import { FormControlPalette } from './pages/mockups/FormControlPalette'
import { LifecycleStates } from './pages/mockups/LifecycleStates'
import { LookAndFeel } from './pages/mockups/LookAndFeel'
import { Panels } from './pages/mockups/Panels'
import { RecentActivityDemo } from './pages/mockups/RecentActivityDemo'
import { TitleBarDemo } from './pages/mockups/TitleBarDemo'

export const router = createBrowserRouter([
  // Main application: after signing in, users land on the dashboard.
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard', element: <DefaultDashboard /> },
      { path: '/users', element: <UserManagement /> },
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
])
