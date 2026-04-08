import {
  fetchMyQuiz,
  fetchQuizProfile,
  fetchQuizResults,
} from '@/src/services/quiz'
import { queryOptions } from '@tanstack/react-query'

export const quizKeys = {
  all: ['quiz'] as const,
  submission: () => [...quizKeys.all, 'submission'] as const,
  profile: () => [...quizKeys.all, 'profile'] as const,
  results: (page: number, pageSize: number) =>
    [...quizKeys.all, 'results', page, pageSize] as const,
}

export const quizQueries = {
  submission: () =>
    queryOptions({
      queryKey: quizKeys.submission(),
      queryFn: fetchMyQuiz,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    }),
  profile: () =>
    queryOptions({
      queryKey: quizKeys.profile(),
      queryFn: fetchQuizProfile,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    }),
  results: (page = 1, pageSize = 10) =>
    queryOptions({
      queryKey: quizKeys.results(page, pageSize),
      queryFn: () => fetchQuizResults(page, pageSize),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    }),
}
