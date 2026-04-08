import { useSuspenseQuery } from '@tanstack/react-query'
import { userQueries, type UserRole } from '@/src/queries/users'

interface UseUsersPaginatedParams {
  role: UserRole
  page: number
  limit: number
  search: string
  token: string
}

export function useUsersPaginated(params: UseUsersPaginatedParams) {
  return useSuspenseQuery({
    ...userQueries.list(params),
  })
}
