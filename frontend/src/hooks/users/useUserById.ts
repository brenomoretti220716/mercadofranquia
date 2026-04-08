import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { getUserById } from '@/src/services/users'

export function useUserById(userId: string | undefined) {
  const { token } = useAuth()

  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(token!, userId!),
    enabled: !!token && !!userId,
    retry: false,
  })
}
