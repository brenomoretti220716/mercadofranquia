import {
  CreateReviewFormData,
  CreateAuthenticatedReviewFormData,
} from '@/src/schemas/franchises/Reviews'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Api from '../../api/Api'
import { getClientAuthCookie } from '../../utils/clientCookie'
import { handleHttpError, formatErrorMessage } from '../../utils/errorHandlers'
import { getMe } from '../../services/users'

// ===== CREATE REVIEW MUTATION =====
export function useCreateFranchiseeReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      data,
      franchiseId,
    }: {
      data: CreateReviewFormData
      franchiseId: string
    }) => {
      const token = getClientAuthCookie()

      if (!token) {
        throw new Error(
          'Você precisa estar logado para adicionar um depoimento',
        )
      }

      const response = await fetch(
        Api(`/reviews/franchise/franchisee/${franchiseId}`),
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        },
      )

      if (!response.ok) {
        let errorMessage = 'Erro ao cadastrar depoimento'

        if (response.status === 400) {
          errorMessage = 'Você já avaliou essa franquia.'
        } else if (response.status === 401) {
          errorMessage =
            'Você não tem permissão para adicionar depoimentos nesta franquia.'
        } else if (response.status === 404) {
          errorMessage = 'Franquia não encontrada.'
        } else {
          errorMessage = handleHttpError(
            response,
            'Erro ao cadastrar depoimento. Tente novamente.',
          )
        }

        throw new Error(errorMessage)
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Depoimento cadastrado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['franchise-reviews'] })
    },
    onError: (error) => {
      console.error('Create review error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível cadastrar o depoimento. Tente novamente.',
        ),
      )
    },
  })
}
export function useCreateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      data,
      franchiseId,
    }: {
      data: CreateReviewFormData
      franchiseId: string
    }) => {
      const response = await fetch(Api(`/reviews/${franchiseId}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        if (response.status === 400) {
          // Para erro 400, retornamos um objeto especial em vez de lançar erro
          return {
            success: false,
            codeAlreadySent: true,
            message: 'Código já enviado para este email.',
          }
        } else if (response.status === 401) {
          throw new Error('Código expirado.')
        } else if (response.status === 404) {
          throw new Error('Depoimento não encontrado.')
        } else {
          throw new Error(
            handleHttpError(
              response,
              'Erro ao cadastrar depoimento. Tente novamente.',
            ),
          )
        }
      }

      return response.json()
    },
    onSuccess: (data) => {
      if (data && data.codeAlreadySent) {
        toast.info(data.message)
      } else {
        toast.success('Código enviado com sucesso!')
        queryClient.invalidateQueries({ queryKey: ['franchise-reviews'] })
      }
    },
    onError: (error) => {
      console.error('Create review error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível cadastrar o depoimento. Tente novamente.',
        ),
      )
    },
  })
}

// ===== CREATE AUTHENTICATED REVIEW MUTATION =====
export function useCreateAuthenticatedReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      data,
      franchiseId,
    }: {
      data: CreateAuthenticatedReviewFormData
      franchiseId: string
    }) => {
      const token = getClientAuthCookie()

      if (!token) {
        throw new Error(
          'Você precisa estar logado para adicionar um depoimento',
        )
      }

      // Fetch complete user data including CPF
      const userData = await getMe(token)

      // Create the full review data with user information
      const fullReviewData = {
        authorName: userData.name,
        email: userData.email,
        cpf: userData.cpf,
        anonymous: data.anonymous,
        rating: data.rating,
        comment: data.comment,
        franchiseId,
      }

      const response = await fetch(Api(`/reviews/${franchiseId}`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullReviewData),
      })

      if (!response.ok) {
        let errorMessage = 'Erro ao cadastrar depoimento'

        if (response.status === 400) {
          errorMessage = 'Você já avaliou essa franquia.'
        } else if (response.status === 401) {
          errorMessage = 'Você não tem permissão para adicionar depoimentos.'
        } else if (response.status === 403) {
          errorMessage = 'Administradores não podem criar depoimentos.'
        } else if (response.status === 404) {
          errorMessage = 'Franquia não encontrada.'
        } else {
          errorMessage = handleHttpError(
            response,
            'Erro ao cadastrar depoimento. Tente novamente.',
          )
        }

        throw new Error(errorMessage)
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Depoimento cadastrado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['franchise-reviews'] })
    },
    onError: (error) => {
      console.error('Create authenticated review error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível cadastrar o depoimento. Tente novamente.',
        ),
      )
    },
  })
}

export function useValidateCode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      franchiseId,
      code,
      email,
    }: {
      franchiseId: string
      code: string
      email: string
    }) => {
      const response = await fetch(Api(`/reviews/verify/${franchiseId}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          email,
        }),
      })

      if (!response.ok) {
        // Mensagens específicas para validação de código
        let errorMessage = 'Erro ao validar código'

        if (response.status === 400) {
          errorMessage = 'Código inválido. Verifique o código digitado.'
        } else if (response.status === 401) {
          errorMessage = 'Código expirado.'
        } else if (response.status === 404) {
          errorMessage = 'Review não encontrada. Tente novamente.'
        } else if (response.status === 429) {
          errorMessage =
            'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.'
        } else {
          errorMessage = handleHttpError(response, 'Erro ao validar código')
        }

        throw new Error(errorMessage)
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Código validado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['franchise-reviews'] })
    },
    onError: (error) => {
      console.error('Validate code error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível validar o código. Tente novamente.',
        ),
      )
    },
  })
}

// ===== CREATE REVIEW RESPONSE MUTATION =====
export function useCreateReviewResponse(franchiseId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      reviewId,
      content,
      token,
    }: {
      reviewId: number
      content: string
      token: string
    }) => {
      const response = await fetch(Api(`/reviews/${reviewId}/responses`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const message = handleHttpError(
          response,
          'Não foi possível criar a resposta. Tente novamente.',
        )
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate both query key patterns for compatibility
      queryClient.invalidateQueries({ queryKey: ['franchise-reviews'] })
      if (franchiseId) {
        queryClient.invalidateQueries({
          queryKey: ['franchise-reviews', franchiseId],
        })
        queryClient.invalidateQueries({
          queryKey: ['reviews', 'franchisor', franchiseId],
        })
      }
    },
    onError: (error) => {
      console.error('Create review response error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível criar a resposta. Tente novamente.',
        ),
      )
    },
  })
}
