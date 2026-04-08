import { newsCommentKeys, newsCommentQueries } from '@/src/queries/newsComments'
import { CreateNewsCommentData } from '@/src/schemas/news/NewsComment'
import {
  createNewsComment,
  deleteNewsComment,
} from '@/src/services/newsComments'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useNewsComments(newsId: string) {
  return useQuery({
    ...newsCommentQueries.list(newsId),
  })
}

export function useCreateNewsComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      newsId,
      data,
    }: {
      newsId: string
      data: CreateNewsCommentData
    }) => {
      return createNewsComment(newsId, data)
    },
    onSuccess: (_, variables) => {
      toast.success('Comentário adicionado com sucesso!')
      queryClient.invalidateQueries({
        queryKey: newsCommentKeys.list(variables.newsId),
      })
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Erro ao adicionar comentário'
      toast.error(errorMessage)
    },
  })
}

export function useDeleteNewsComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      commentId,
    }: {
      commentId: string
      newsId: string
    }) => {
      return deleteNewsComment(commentId)
    },
    onSuccess: (_, variables) => {
      toast.success('Comentário deletado com sucesso!')
      queryClient.invalidateQueries({
        queryKey: newsCommentKeys.list(variables.newsId),
      })
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Erro ao deletar comentário'
      toast.error(errorMessage)
    },
  })
}
