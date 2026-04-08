import {
  fetchFranchiseById,
  fetchFranchiseOptions,
  fetchFranchiseOptionsWithParams,
  fetchFranchises,
  fetchFranchisorFranchises,
  fetchPaginatedFranchises,
  type FetchFranchisesParams,
} from '@/src/services/franchises'
import { queryOptions } from '@tanstack/react-query'

export type { FetchFranchisesParams } from '@/src/services/franchises'

export const franchiseKeys = {
  all: ['franchises'] as const,
  lists: () => [...franchiseKeys.all, 'list'] as const,
  list: (filters: FetchFranchisesParams) =>
    [...franchiseKeys.lists(), filters] as const,
  options: () => [...franchiseKeys.all, 'options'] as const,
  availableOptions: () =>
    [...franchiseKeys.all, 'options', 'available'] as const,
  availableOptionsForUser: (userId: string) =>
    [...franchiseKeys.all, 'options', 'available', 'user', userId] as const,
  details: () => [...franchiseKeys.all, 'detail'] as const,
  detail: (id: string) => [...franchiseKeys.details(), id] as const,
  paginated: (params: FetchFranchisesParams) =>
    [...franchiseKeys.all, 'paginated', params] as const,
  franchisor: (franchisorId: string) =>
    [...franchiseKeys.all, 'franchisor', franchisorId] as const,
}

export const franchiseQueries = {
  all: () =>
    queryOptions({
      queryKey: franchiseKeys.lists(),
      queryFn: () => fetchFranchises(),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    }),
  options: () =>
    queryOptions({
      queryKey: franchiseKeys.options(),
      queryFn: () => fetchFranchiseOptions(),
      staleTime: 1000 * 60 * 5,
    }),
  availableOptions: () =>
    queryOptions({
      queryKey: franchiseKeys.availableOptions(),
      queryFn: () => fetchFranchiseOptionsWithParams({ availableOnly: true }),
      staleTime: 1000 * 60 * 2,
    }),
  availableOptionsForUser: (userId: string) =>
    queryOptions({
      queryKey: franchiseKeys.availableOptionsForUser(userId),
      queryFn: () =>
        fetchFranchiseOptionsWithParams({ availableOnly: true, userId }),
      staleTime: 1000 * 60 * 2,
    }),
  detail: (id: string, token?: string) =>
    queryOptions({
      queryKey: franchiseKeys.detail(id),
      queryFn: () => fetchFranchiseById(id, token),
      staleTime: 1000 * 60 * 5,
      enabled: !!id,
    }),
  paginated: (params: FetchFranchisesParams, token?: string) =>
    queryOptions({
      queryKey: franchiseKeys.paginated(params),
      queryFn: () => fetchPaginatedFranchises(params, token),
      staleTime: 1000 * 60 * 5,
      placeholderData: (previous) => previous,
    }),
  franchisor: (franchisorId: string, token: string) =>
    queryOptions({
      queryKey: franchiseKeys.franchisor(franchisorId),
      queryFn: () => fetchFranchisorFranchises(franchisorId, token),
      staleTime: 1000 * 60 * 5,
      enabled: !!franchisorId && !!token,
    }),
}
