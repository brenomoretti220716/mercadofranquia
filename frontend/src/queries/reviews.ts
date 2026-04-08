import {
  fetchFranchiseReviewsPaginated,
  fetchLatestReviews,
  fetchReviews,
  fetchUserReviews,
} from '@/src/services/reviews'
import { queryOptions } from '@tanstack/react-query'

export const reviewKeys = {
  all: ['reviews'] as const,
  lists: () => [...reviewKeys.all, 'list'] as const,
  list: (franchiseId: string) => [...reviewKeys.lists(), franchiseId] as const,
  listPaginated: (franchiseId: string, page: number, limit: number) =>
    [...reviewKeys.lists(), franchiseId, page, limit] as const,
  franchisor: (franchiseId: string) =>
    [...reviewKeys.all, 'franchisor', franchiseId] as const,
  myReviews: (page: number, limit: number, sortBy: string) =>
    [...reviewKeys.all, 'my-reviews', page, limit, sortBy] as const,
  latest: (limit: number) => [...reviewKeys.all, 'latest', limit] as const,
}

export const reviewQueries = {
  list: (franchiseId: string, token?: string) =>
    queryOptions({
      queryKey: reviewKeys.list(franchiseId),
      queryFn: () => fetchReviews(franchiseId, token),
      staleTime: 1000 * 60 * 2,
      retry: 1,
      enabled: !!franchiseId,
    }),
  franchisor: (franchiseId: string, token: string) =>
    queryOptions({
      queryKey: reviewKeys.franchisor(franchiseId),
      queryFn: () => fetchReviews(franchiseId, token),
      staleTime: 1000 * 60 * 2,
      retry: 1,
      enabled: !!franchiseId && !!token,
    }),
  byFranchisePaginated: (
    franchiseId: string,
    page: number,
    limit: number,
    token?: string,
  ) =>
    queryOptions({
      queryKey: reviewKeys.listPaginated(franchiseId, page, limit),
      queryFn: () =>
        fetchFranchiseReviewsPaginated({ franchiseId, page, limit, token }),
      staleTime: 1000 * 60 * 2,
      retry: 1,
      enabled: !!franchiseId,
    }),
  myReviews: (
    page: number,
    limit: number,
    sortBy: 'review' | 'response',
    token: string,
  ) =>
    queryOptions({
      queryKey: reviewKeys.myReviews(page, limit, sortBy),
      queryFn: () => fetchUserReviews({ page, limit, sortBy, token }),
      staleTime: 1000 * 60,
      retry: (failureCount, error: unknown) => {
        const status = (error as { status?: number })?.status
        if (status === 401 || status === 404) {
          return false
        }
        return failureCount < 2
      },
      enabled: !!token,
    }),
  latest: (limit: number) =>
    queryOptions({
      queryKey: reviewKeys.latest(limit),
      queryFn: () => fetchLatestReviews(limit),
      staleTime: 1000 * 60 * 2,
      retry: 1,
    }),
}
