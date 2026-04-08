'use client'

import { quizKeys } from '@/src/queries/quiz'
import type { QuizFormValues } from '@/src/schemas/quiz/quiz'
import { submitQuiz, updateQuiz } from '@/src/services/quiz'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useSubmitQuiz() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.submission() })
      queryClient.invalidateQueries({
        queryKey: quizKeys.results(1, 10),
      })
      toast.success('Quiz enviado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar quiz')
    },
  })
}

export function useUpdateQuiz() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: QuizFormValues) => updateQuiz(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.submission() })
      queryClient.invalidateQueries({ queryKey: quizKeys.results(1, 10) })
      toast.success('Quiz atualizado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar quiz')
    },
  })
}
