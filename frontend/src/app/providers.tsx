'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/next'
import { Suspense, useState } from 'react'
import { Toaster } from 'sonner'
import { HeaderProvider } from '../contexts/AuthContext'
import { NotificationsProvider } from '../contexts/NotificationsContext'
import { RankingProvider } from '../contexts/RankingContext'

type ProvidersProps = {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 30,
            retry: 2,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchOnMount: true,
          },
          mutations: {
            retry: 1,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <Suspense fallback={null}>
          <HeaderProvider>
            <NotificationsProvider>
              <RankingProvider>{children}</RankingProvider>
            </NotificationsProvider>
          </HeaderProvider>
        </Suspense>
      </NuqsAdapter>
      <Toaster />
    </QueryClientProvider>
  )
}
