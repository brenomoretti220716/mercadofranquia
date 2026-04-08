import { useSuspenseQuery } from '@tanstack/react-query'
import {
  fetchPaginatedFavorites,
  FetchFavoritesParams,
} from '@/src/services/franchises'

export interface UseFavoritesPaginatedProps {
  page?: number
  limit?: number
  search?: string
  sortBy?: 'createdAt' | 'name'
  order?: 'asc' | 'desc'
  token: string
}

export const useFavoritesPaginated = ({
  page = 1,
  limit = 20,
  search = '',
  sortBy = 'createdAt',
  order = 'desc',
  token,
}: UseFavoritesPaginatedProps) => {
  const params: FetchFavoritesParams = {
    page,
    limit,
    search,
    sortBy,
    order,
  }

  const { data } = useSuspenseQuery({
    queryKey: ['favorites', page, limit, search, sortBy, order],
    queryFn: () => fetchPaginatedFavorites(params, token),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  return {
    franchises: data && data.data ? data.data : [],
    total: data && typeof data.total === 'number' ? data.total : 0,
    page: data && typeof data.page === 'number' ? data.page : page,
    lastPage: data && typeof data.lastPage === 'number' ? data.lastPage : 1,
  }
}
