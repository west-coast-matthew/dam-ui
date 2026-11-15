import { createBrowserRouter, Navigate } from 'react-router'
import { LookAndFeel } from './pages/mockups/LookAndFeel'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/mock/look-and-feel" replace /> },
  { path: '/mock/look-and-feel', element: <LookAndFeel /> },
])
