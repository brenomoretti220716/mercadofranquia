import Api from '@/src/api/Api'
import { getClientAuthCookie } from '@/src/utils/clientCookie'
import { useQuery } from '@tanstack/react-query'

interface ProfileCompletionResponse {
  isComplete: boolean
  completionPercentage: number
  missingFields: string[]
}

/**
 * Hook to fetch and cache profile completion status from the backend
 */
export function useProfileCompletion(enabled: boolean = true) {
  return useQuery({
    queryKey: ['profile-completion'],
    queryFn: async (): Promise<ProfileCompletionResponse> => {
      const token = getClientAuthCookie()

      if (!token) {
        return {
          isComplete: false,
          completionPercentage: 0,
          missingFields: [],
        }
      }

      const response = await fetch(Api('/users/me/profile-completion'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        return {
          isComplete: false,
          completionPercentage: 0,
          missingFields: [],
        }
      }

      return response.json()
    },
    enabled,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  })
}
