import { createBrowserRouter, Navigate } from 'react-router'
import { AssetBrowseDemo } from './pages/mockups/AssetBrowseDemo'
import { AssetUploadDemo } from './pages/mockups/AssetUploadDemo'
import { FormControlPalette } from './pages/mockups/FormControlPalette'
import { LifecycleStates } from './pages/mockups/LifecycleStates'
import { LookAndFeel } from './pages/mockups/LookAndFeel'
import { Panels } from './pages/mockups/Panels'
import { TitleBarDemo } from './pages/mockups/TitleBarDemo'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/mock/look-and-feel" replace /> },
  { path: '/mock/look-and-feel', element: <LookAndFeel /> },
  { path: '/mock/panels', element: <Panels /> },
  { path: '/mock/form-controls', element: <FormControlPalette /> },
  { path: '/mock/title-bar', element: <TitleBarDemo /> },
  { path: '/mock/asset-browse', element: <AssetBrowseDemo /> },
  { path: '/mock/lifecycle-states', element: <LifecycleStates /> },
  { path: '/mock/asset-upload', element: <AssetUploadDemo /> },
])
