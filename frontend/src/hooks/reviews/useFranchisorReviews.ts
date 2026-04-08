'use client'

import { useQuery } from '@tanstack/react-query'
import { useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { useAuth } from '../users/useAuth'
import { franchiseQueries } from '@/src/queries/franchises'
import { reviewQueries } from '@/src/queries/reviews'

interface Franchise {
  id: string
  name: string
  photoUrl?: string
}

export function useFranchisorReviews() {
  const { payload, token } = useAuth()
  const [franchiseId, setFranchiseId] = useQueryState<string | null>(
    'franchise',
    {
      history: 'replace',
      parse: (value) => value ?? null,
    },
  )

  const {
    data: franchises = [],
    isLoading: isLoadingFranchises,
    error: franchisesError,
  } = useQuery({
    ...franchiseQueries.franchisor(payload!.id, token!),
    enabled: !!token && !!payload?.id,
  })

  useEffect(() => {
    if (franchises.length > 0) {
      if (!franchiseId || !franchises.some((f) => f.id === franchiseId)) {
        setFranchiseId(franchises[0].id)
      }
    }
  }, [franchises, franchiseId, setFranchiseId])

  const {
    data: reviews = [],
    isLoading: isLoadingReviews,
    error: reviewsError,
    refetch: refetchReviews,
  } = useQuery({
    ...reviewQueries.franchisor(franchiseId!, token!),
    enabled: !!franchiseId && !!token,
  })

  const selectedFranchise = franchises.find(
    (f: Franchise) => f.id === franchiseId,
  )

  return {
    franchises,
    reviews,
    selectedFranchise,
    selectedFranchiseId: franchiseId,
    isLoadingFranchises,
    isLoadingReviews,
    franchisesError,
    reviewsError,
    refetchReviews,
    setSelectedFranchiseId: setFranchiseId,
    payload,
    token,
  }
}
