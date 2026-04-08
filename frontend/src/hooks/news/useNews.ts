import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { newsQueries } from '@/src/queries/news'

interface UseNewsParams {
  page?: number
  limit?: number
  search?: string
  category?: string
}

export function useNews({
  page = 1,
  limit = 10,
  search = '',
  category,
}: UseNewsParams) {
  return useSuspenseQuery({
    ...newsQueries.list({ page, limit, search, category }),
  })
}

export function useNewsById(id: string) {
  return useSuspenseQuery({
    ...newsQueries.byId(id),
  })
}

export function useRelatedNews(
  category: string,
  currentId: string,
  enabled: boolean = true,
) {
  return useQuery({
    ...newsQueries.related(category, currentId, enabled),
  })
}
