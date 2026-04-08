import { rankingBigNumbersQueries } from '@/src/queries/rankingBigNumbers'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'

export function useRankingBigNumbers(year?: number) {
  const { data, isLoading, isFetching } = useQuery(
    rankingBigNumbersQueries.list(year),
  )
  const { data: years = [] } = useQuery(rankingBigNumbersQueries.years())

  return {
    cards: data ?? [],
    years,
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
