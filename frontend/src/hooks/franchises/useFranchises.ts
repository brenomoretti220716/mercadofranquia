import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import type { Franchise } from '@/src/schemas/franchises/Franchise'
import { franchiseQueries } from '@/src/queries/franchises'

interface FranchiseOption {
  value: string
  label: string
}

interface UseFranchisesOptions {
  enabled?: boolean
  staleTime?: number
  refetchOnWindowFocus?: boolean
}

export function useFranchiseById(
  idOrSlug: string,
  options: UseFranchisesOptions = {},
) {
  const { staleTime = 1000 * 60 * 5, refetchOnWindowFocus = false } = options
  const { data } = useSuspenseQuery({
    ...franchiseQueries.detail(idOrSlug),
    staleTime,
    refetchOnWindowFocus,
  })
  return data
}

export function useFranchises(options: UseFranchisesOptions = {}) {
  const { staleTime = 1000 * 60 * 5, refetchOnWindowFocus = false } = options

  const listQuery = useSuspenseQuery({
    ...franchiseQueries.all(),
    staleTime,
    refetchOnWindowFocus,
  })

  const optionsQuery = useSuspenseQuery({
    ...franchiseQueries.options(),
    staleTime,
    refetchOnWindowFocus,
  })

  const franchiseOptions: FranchiseOption[] = optionsQuery.data || []

  return {
    franchises: (listQuery.data as Franchise[] | undefined) || [],
    franchiseOptions,
    isLoading: false,
    isError: false,
    error: undefined,
    refetch: listQuery.refetch,
    isFetching: false,
    isSuccess: true,
  }
}

export function useFranchise(id: string, options: UseFranchisesOptions = {}) {
  const { franchises, isLoading, isError, error } = useFranchises(options)

  const franchise = franchises.find((f) => f.id === id)

  return {
    franchise,
    isLoading,
    isError,
    error,
    found: !!franchise,
  }
}

export function useFranchisorFranchises(
  franchisorId: string,
  token: string,
  options: UseFranchisesOptions = {},
) {
  const { staleTime = 1000 * 60 * 5, refetchOnWindowFocus = false } = options

  const { data } = useSuspenseQuery({
    ...franchiseQueries.franchisor(franchisorId, token),
    staleTime,
    refetchOnWindowFocus,
  })

  return data || []
}

export function useFranchisorFranchisesQuery(
  franchisorId: string,
  token: string | undefined,
  options: UseFranchisesOptions = {},
) {
  const { staleTime = 1000 * 60 * 5, refetchOnWindowFocus = false } = options

  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    ...franchiseQueries.franchisor(franchisorId, token!),
    enabled: !!token && !!franchisorId,
    staleTime,
    refetchOnWindowFocus,
  })

  return {
    franchises: data || [],
    isLoading,
    isError,
    error,
  }
}
