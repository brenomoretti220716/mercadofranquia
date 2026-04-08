import { queryOptions } from '@tanstack/react-query'
import {
  fetchNews,
  fetchNewsById,
  fetchRelatedNews,
  type FetchNewsParams,
} from '@/src/services/news'

export type { FetchNewsParams } from '@/src/services/news'

export const newsKeys = {
  all: ['news'] as const,
  lists: () => [...newsKeys.all, 'list'] as const,
  list: (params: FetchNewsParams) => [...newsKeys.lists(), params] as const,
  details: () => [...newsKeys.all, 'detail'] as const,
  detail: (id: string) => [...newsKeys.details(), id] as const,
  related: (category: string, currentId: string) =>
    [...newsKeys.all, 'related', category, currentId] as const,
}

export const newsQueries = {
  list: (params: FetchNewsParams) =>
    queryOptions({
      queryKey: newsKeys.list(params),
      queryFn: () => fetchNews(params),
      staleTime: 1000 * 60 * 5,
    }),
  byId: (id: string) =>
    queryOptions({
      queryKey: newsKeys.detail(id),
      queryFn: () => fetchNewsById(id),
      staleTime: 1000 * 60 * 5,
    }),
  related: (category: string, currentId: string, enabled: boolean = true) =>
    queryOptions({
      queryKey: newsKeys.related(category, currentId),
      queryFn: () => fetchRelatedNews(category, currentId),
      staleTime: 1000 * 60 * 5,
      enabled: enabled && !!category && !!currentId,
    }),
}
