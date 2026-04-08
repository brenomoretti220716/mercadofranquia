import { rankingBigNumbersQueries } from '@/src/queries/rankingBigNumbers'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'

export function useRankingBigNumbers(year?: number) {
  const { data, isLoading, isFetching } = useQuery(
    rankingBigNumbersQueries.list(year),
  )

  return {
    cards: data ?? [],
    isLoading,
    isFetching,
  }
}

export function useAdminRankingBigNumbers(year?: number) {
  const { data } = useSuspenseQuery(rankingBigNumbersQueries.adminList(year))
  return {
    cards: data ?? [],
  }
}
