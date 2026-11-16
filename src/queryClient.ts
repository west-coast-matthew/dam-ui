import { QueryClient } from '@tanstack/react-query'

/** Shared TanStack Query client for calls to the (currently mocked) services. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Mock calls take 2-8 seconds, so retry once rather than three times before showing an error.
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})
