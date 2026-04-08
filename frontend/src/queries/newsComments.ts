import { fetchNewsComments } from '@/src/services/newsComments'
import { queryOptions } from '@tanstack/react-query'

export const newsCommentKeys = {
  all: ['newsComments'] as const,
  lists: () => [...newsCommentKeys.all, 'list'] as const,
  list: (newsId: string) => [...newsCommentKeys.lists(), newsId] as const,
}

export const newsCommentQueries = {
  list: (newsId: string) =>
    queryOptions({
      queryKey: newsCommentKeys.list(newsId),
      queryFn: () => fetchNewsComments(newsId),
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
}
