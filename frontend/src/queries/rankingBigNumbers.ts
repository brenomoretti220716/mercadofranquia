import {
  fetchAdminRankingBigNumbers,
  fetchRankingBigNumbers,
  fetchRankingBigNumbersYears,
} from '@/src/services/franchises'
import { queryOptions } from '@tanstack/react-query'

export const rankingBigNumbersKeys = {
  all: ['ranking-big-numbers'] as const,
  list: (year?: number) =>
    [...rankingBigNumbersKeys.all, year ?? 'current'] as const,
  adminList: (year?: number) =>
    [...rankingBigNumbersKeys.all, 'admin', year ?? 'current'] as const,
  years: () => [...rankingBigNumbersKeys.all, 'years'] as const,
}

export const rankingBigNumbersQueries = {
  list: (year?: number) =>
    queryOptions({
      queryKey: rankingBigNumbersKeys.list(year),
      queryFn: () => fetchRankingBigNumbers(year),
      staleTime: 1000 * 60 * 5,
    }),
  adminList: (year?: number) =>
    queryOptions({
      queryKey: rankingBigNumbersKeys.adminList(year),
      queryFn: () => fetchAdminRankingBigNumbers(year),
      staleTime: 1000 * 60 * 2,
    }),
  years: () =>
    queryOptions({
      queryKey: rankingBigNumbersKeys.years(),
      queryFn: fetchRankingBigNumbersYears,
      staleTime: 1000 * 60 * 5,
    }),
}
