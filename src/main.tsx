import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { ThemeProvider } from './theme/ThemeProvider'
import { WorkspaceProvider } from './workspace/WorkspaceProvider'
import { router } from './router'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <WorkspaceProvider>
        <RouterProvider router={router} />
      </WorkspaceProvider>
    </ThemeProvider>
  </StrictMode>,
)
