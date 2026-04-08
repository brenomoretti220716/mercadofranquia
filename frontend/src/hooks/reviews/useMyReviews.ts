'use client'

import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { reviewQueries } from '@/src/queries/reviews'
import { useAuth } from '@/src/hooks/users/useAuth'

type SortOption = 'review' | 'response'

const DEFAULT_LIMIT = 10

export function useMyReviews(initialLimit: number = DEFAULT_LIMIT) {
  const { token, isAuthenticated, isValidating } = useAuth()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(initialLimit)
  const [sortBy, setSortBy] = useState<SortOption>('review')

  const queryEnabled = Boolean(token) && isAuthenticated && !isValidating

  const query = useQuery({
    ...reviewQueries.myReviews(page, limit, sortBy, token || ''),
    enabled: queryEnabled,
  })

  const { data, isLoading, isError, error, refetch, isFetching } = query

  const pagination = useMemo(
    () => ({
      page,
      limit,
      total: data?.total ?? 0,
      lastPage: data?.lastPage ?? 0,
    }),
    [data?.lastPage, data?.total, limit, page],
  )

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage)
  }, [])

  const handleLimitChange = useCallback((nextLimit: number) => {
    setLimit(nextLimit)
    setPage(1)
  }, [])

  const handleSortChange = useCallback((nextSort: SortOption) => {
    setSortBy(nextSort)
    setPage(1)
  }, [])

  return {
    reviews: data?.data ?? [],
    pagination,
    sortBy,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    isAuthenticated,
    isValidating,
    handlePageChange,
    handleLimitChange,
    handleSortChange,
    limit,
  }
}

export type UseMyReviewsReturn = ReturnType<typeof useMyReviews>
