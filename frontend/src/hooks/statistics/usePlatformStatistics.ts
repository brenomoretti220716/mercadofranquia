import { useQuery } from '@tanstack/react-query'
import Api from '@/src/api/Api'

interface PlatformStatistics {
  franchisesReviewed: number
  totalReviews: number
  totalSegments: number
  medianRating: number | null
}

export function usePlatformStatistics() {
  return useQuery<PlatformStatistics>({
    queryKey: ['platform-statistics'],
    queryFn: async () => {
      const response = await fetch(Api('/statistics'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch statistics: ${response.status}`)
      }

      return response.json()
    },
    staleTime: 3600000, // 1 hour - stats don't change frequently
    refetchOnWindowFocus: false,
  })
}
