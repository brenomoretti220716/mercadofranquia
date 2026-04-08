import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Api from '../../api/Api'
import { getClientAuthCookie } from '../../utils/clientCookie'
import { handleHttpError } from '../../utils/errorHandlers'

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (franchiseId: string) => {
      const token = getClientAuthCookie()

      if (!token) {
        throw new Error('Você precisa estar logado para favoritar uma franquia')
      }

      const response = await fetch(Api(`/favorites/${franchiseId}/toggle`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorMessage = handleHttpError(
          response,
          'Erro ao favoritar franquia',
        )
        throw new Error(errorMessage)
      }

      return response.json()
    },
    onSuccess: (data, franchiseId) => {
      if (data.data.isFavorited) {
        toast.success('Franquia adicionada aos favoritos!')
      } else {
        toast.success('Franquia removida dos favoritos!')
      }
      queryClient.invalidateQueries({ queryKey: ['favorite', franchiseId] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
    onError: (error) => {
      console.error('Toggle favorite error:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro inesperado. Tente novamente.',
      )
    },
  })
}

export function useCheckFavorite(
  franchiseId: string,
  enabled: boolean = false,
) {
  return useQuery({
    queryKey: ['favorite', franchiseId],
    queryFn: async () => {
      const token = getClientAuthCookie()

      if (!token) {
        return { isFavorited: false }
      }

      const response = await fetch(Api(`/favorites/check/${franchiseId}`), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        return { isFavorited: false }
      }

      return response.json()
    },
    enabled,
  })
}
