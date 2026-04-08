import { queryOptions } from '@tanstack/react-query'
import {
  fetchUsersPaginated,
  type FetchUsersParams,
  type UserRole,
} from '@/src/services/users'

export type { FetchUsersParams, UserRole } from '@/src/services/users'

export const userKeys = {
  all: ['user'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (role: UserRole, params: Omit<FetchUsersParams, 'role'>) =>
    [...userKeys.lists(), role, params] as const,
}

export const userQueries = {
  list: (params: FetchUsersParams) =>
    queryOptions({
      queryKey: userKeys.list(params.role, params),
      queryFn: () => fetchUsersPaginated(params),
      staleTime: 1000 * 60 * 5,
      enabled: !!params.token,
    }),
}
