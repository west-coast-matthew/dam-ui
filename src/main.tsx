import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { ThemeProvider } from './theme/ThemeProvider'
import { WorkspaceProvider } from './workspace/WorkspaceProvider'
import { queryClient } from './queryClient'
import { router } from './router'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      {/* The workspace list comes from the API through React Query, so the query client wraps it. */}
      <QueryClientProvider client={queryClient}>
        <WorkspaceProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </WorkspaceProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
