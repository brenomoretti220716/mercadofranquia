import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Api from '../../api/Api'
import { getClientAuthCookie } from '../../utils/clientCookie'
import { handleHttpError, formatErrorMessage } from '../../utils/errorHandlers'
import { CreateNewsSchema, UpdateNewsSchema } from '@/src/schemas/users/News'

// ===== CREATE NEWS MUTATION =====
export function useCreateNews() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateNewsSchema) => {
      const token = getClientAuthCookie()

      if (!token) {
        throw new Error('No authentication found')
      }

      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('category', data.category)
      formData.append('summary', data.summary)
      formData.append('content', data.content)

      if (data.photo) {
        formData.append('photo', data.photo)
      }

      const response = await fetch(Api('/news'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorMessage = handleHttpError(
          response,
          'Erro ao cadastrar notícia',
        )
        throw new Error(errorMessage)
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Cadastro realizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['news'] })
    },
    onError: (error) => {
      console.error('Create news error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Erro ao cadastrar notícia. Tente novamente.',
        ),
      )
    },
  })
}

// ===== UPDATE NEWS MUTATION =====
export function useUpdateNews() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      data,
      newsId,
    }: {
      data: UpdateNewsSchema
      newsId: string
    }) => {
      const token = getClientAuthCookie()

      if (!token) {
        throw new Error('No authentication found')
      }

      const formData = new FormData()
      formData.append('id', data.id)

      if (data.title) formData.append('title', data.title)
      if (data.category) formData.append('category', data.category)
      if (data.summary) formData.append('summary', data.summary)
      if (data.content) formData.append('content', data.content)
      if (data.isActive !== undefined)
        formData.append('isActive', data.isActive.toString())

      if (data.photo) {
        formData.append('photo', data.photo)
      }

      const response = await fetch(Api(`/news/${newsId}`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorMessage = handleHttpError(
          response,
          'Erro ao atualizar notícia',
        )
        throw new Error(errorMessage)
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Notícia atualizada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['news'] })
    },
    onError: (error) => {
      console.error('Update news error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Erro ao atualizar notícia. Tente novamente.',
        ),
      )
    },
  })
}
