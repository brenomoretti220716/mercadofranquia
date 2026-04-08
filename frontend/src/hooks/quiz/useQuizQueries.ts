'use client'

import { quizQueries } from '@/src/queries/quiz'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'

export function useMyQuiz() {
  return useQuery(quizQueries.submission())
}

export function useQuizResults(page = 1, pageSize = 10) {
  return useSuspenseQuery(quizQueries.results(page, pageSize))
}

export function useQuizProfile() {
  return useQuery(quizQueries.profile())
}
