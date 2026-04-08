import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Api from '../../api/Api'

import { Payload } from '@/src/schemas/auth/auth'
import {
  UpdateFranchisorDto,
  UpdateUserBasicInfoDto,
  UpdateUserProfileDto,
} from '@/src/services/users'
import { formatErrorMessage, handleHttpError } from '@/src/utils/errorHandlers'
import { stripNonDigits } from '@/src/utils/formaters'
import { FranchisorUserRegisterInput } from '../../schemas/users/FranchisorUsers'
import {
  AdminRegisterInput,
  CombinedRegistrationInputType,
  ForgotPasswordEmailInput,
  LoginInput,
  StepTwoRegistrationInput,
} from '../../schemas/users/auth'
import {
  getClientAuthCookie,
  removeClientAuthCookie,
  setClientAuthCookie,
} from '../../utils/clientCookie'

interface LoginResponse {
  access_token: string
}

interface ValidateResponse {
  valid: boolean
  payload: Payload
  message: string
}

function redirectTo(path: string) {
  setTimeout(() => {
    window.location.href = path
  }, 2000)
}

/**
 * Parses backend error messages and returns user-friendly Portuguese messages
 * for specific conflict errors (409 status)
 */
function parseConflictError(
  errorMessage: string,
  defaultMessage: string,
): string {
  const lowerMessage = errorMessage.toLowerCase()

  if (
    lowerMessage.includes('email already exists') ||
    lowerMessage.includes('email already in use')
  ) {
    return 'É necessário utilizar outro e-mail.'
  }

  if (
    lowerMessage.includes('phone already exists') ||
    lowerMessage.includes('phone already in use')
  ) {
    return 'É necessário utilizar outro telefone.'
  }

  if (
    lowerMessage.includes('cpf already exists') ||
    lowerMessage.includes('cpf already in use')
  ) {
    return 'É necessário utilizar outro CPF.'
  }

  return defaultMessage
}

export function useLogin() {
  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const response = await fetch(Api('/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const message =
          response.status === 404
            ? 'Não foi possível realizar o login. Verifique suas credenciais e tente novamente.'
            : handleHttpError(
                response,
                'Não foi possível realizar o login. Tente novamente.',
              )
        throw new Error(message)
      }

      const result: LoginResponse = await response.json()
      return result
    },
    onSuccess: async (data) => {
      const actualToken = data?.access_token

      if (actualToken && typeof actualToken === 'string') {
        setClientAuthCookie(actualToken)

        try {
          const validateResponse = await fetch(Api('/auth/validate'), {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${actualToken}`,
              'Content-Type': 'application/json',
            },
          })

          console.log('🔍 Validation response status:', validateResponse.status)

          if (validateResponse.ok) {
            const validateResult: ValidateResponse =
              await validateResponse.json()
            console.log('🔍 Validation result:', validateResult)

            if (validateResult.valid === true && validateResult.payload) {
              const { payload } = validateResult

              if (payload.isActive === false) {
                removeClientAuthCookie()
                toast.error('o usuário não está ativo', {
                  id: 'inactive-user',
                })
                return
              }

              const userRole = payload.role

              toast.success('Login realizado com sucesso!')

              switch (userRole) {
                case 'ADMIN':
                  redirectTo('/admin')
                  break
                case 'FRANCHISOR':
                  redirectTo('/franqueador')
                  break
                case 'FRANCHISEE':
                case 'CANDIDATE':
                case 'ENTHUSIAST':
                case 'MEMBER':
                  redirectTo('/')
                  break
                default:
                  redirectTo('/')
                  break
              }
            } else {
              console.error('🔍 Validation failed or no user data')
            }
          } else {
            console.error(
              '🔍 Validation response not ok:',
              validateResponse.status,
            )
          }
        } catch (validateError) {
          console.error('Error validating token:', validateError)
          toast.error('Erro na validação do usuário')
        }
      } else {
        console.error('🔍 No token received or invalid token format')
      }
    },
    onError: (error) => {
      console.error('Login error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível realizar o login. Verifique suas credenciais e tente novamente.',
        ),
      )
    },
  })
}

export function useStepOneRegister() {
  return useMutation({
    mutationFn: async (data: CombinedRegistrationInputType) => {
      // Ensure phone is sent as raw digits only
      const sanitizedData = {
        ...data,
        phone: stripNonDigits(data.phone),
      }

      const response = await fetch(Api('/users/members/request-verification'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      })

      if (response.status === 409) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData?.message || ''
        const specificMessage = parseConflictError(
          errorMessage,
          'É necessário utilizar outras informações.',
        )
        throw new Error(specificMessage)
      }

      // Handle rate limiter - return special info instead of throwing error
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          rateLimited: true,
          expiresIn: errorData.expiresIn,
          message: 'Aguarde antes de solicitar um novo código.',
        }
      }

      if (!response.ok) {
        const message = handleHttpError(
          response,
          'Não foi possível solicitar o código de verificação. Tente novamente.',
        )
        throw new Error(message)
      }

      const result = await response.json()
      return { success: true, ...result }
    },
    onSuccess: (data) => {
      if (data.rateLimited) {
        toast.info(data.message)
      } else {
        toast.success('Código de verificação enviado para seu e-mail!')
      }
    },
    onError: (error) => {
      console.error('Request verification error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível solicitar o código de verificação. Tente novamente.',
        ),
      )
    },
  })
}

export function useResendMemberVerification() {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await fetch(Api('/users/members/resend-verification'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          rateLimited: true,
          expiresIn: errorData.expiresIn,
          message: 'Aguarde antes de solicitar um novo código.',
        }
      }

      if (!response.ok) {
        const message = handleHttpError(
          response,
          'Não foi possível reenviar o código. Tente novamente.',
        )
        throw new Error(message)
      }

      return { success: true }
    },
    onSuccess: (data) => {
      if (data.rateLimited) {
        toast.info(data.message)
      } else {
        toast.success('Código reenviado com sucesso!')
      }
    },
    onError: (error) => {
      console.error('Resend verification error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível reenviar o código. Tente novamente.',
        ),
      )
    },
  })
}

export function useVerifyAndCreateMember() {
  return useMutation({
    mutationFn: async (data: { email: string; code: string }) => {
      const response = await fetch(Api('/users/members/verify-and-create'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        let errorMessage = 'Erro ao verificar código'

        if (response.status === 400) {
          errorMessage = 'Código inválido. Verifique o código digitado.'
        } else if (response.status === 401) {
          errorMessage = 'Código expirado. Solicite um novo código.'
        } else if (response.status === 429) {
          errorMessage =
            'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.'
        } else {
          const errorData = await response
            .json()
            .catch(() => ({ message: 'Erro ao verificar código' }))
          errorMessage = errorData.message || errorMessage
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()
      return result
    },
    onSuccess: (data) => {
      // The token should be in data.user.access_token after code validation
      const accessToken = data?.user?.access_token || data?.access_token

      if (accessToken && typeof accessToken === 'string') {
        setClientAuthCookie(accessToken)
        toast.success('Cadastro realizado com sucesso!')
        redirectTo('/')
      } else {
        console.error('No token received from verify and create member')
        toast.error('Erro ao processar cadastro. Token não recebido.')
      }
    },
    onError: (error) => {
      console.error('Verify and create member error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível concluir o cadastro. Tente novamente.',
        ),
      )
    },
  })
}

export function useStepTwoRegister(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: StepTwoRegistrationInput) => {
      const token = getClientAuthCookie()

      if (!token) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch(Api('/users/register/step-two'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const message = handleHttpError(
          response,
          'Não foi possível completar o perfil. Tente novamente.',
        )
        throw new Error(message)
      }

      const result = await response.json()
      return result
    },
    onSuccess: (data) => {
      // Check if a new token is provided and update it
      if (data?.access_token && typeof data.access_token === 'string') {
        setClientAuthCookie(data.access_token)
      }

      // Recarrega dados do usuário e status de completude do perfil
      queryClient.invalidateQueries({ queryKey: ['user-me'] })
      queryClient.invalidateQueries({ queryKey: ['profile-completion'] })
      toast.success('Perfil completado com sucesso!')

      if (options?.onSuccess) {
        options.onSuccess()
      }
    },
    onError: (error) => {
      console.error('Step two registration error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível completar o perfil. Tente novamente.',
        ),
      )
    },
  })
}

export function useGetMe() {
  return useQuery({
    queryKey: ['user-me'],
    queryFn: async () => {
      const token = getClientAuthCookie()

      if (!token) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch(Api('/users/me'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const message = handleHttpError(
          response,
          'Não foi possível recuperar seus dados. Tente novamente.',
        )
        throw new Error(message)
      }

      return response.json()
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateBasicInfo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; phone: string; cpf?: string }) => {
      const token = getClientAuthCookie()

      if (!token) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch(Api('/users/me'), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.status === 409) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData?.message || ''
        const specificMessage = parseConflictError(
          errorMessage,
          'É necessário utilizar outras informações.',
        )
        throw new Error(specificMessage)
      }

      if (!response.ok) {
        const message = handleHttpError(
          response,
          'Não foi possível atualizar as informações básicas. Tente novamente.',
        )
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Informações básicas atualizadas com sucesso!')
      // Recarrega dados do usuário e status de completude do perfil
      queryClient.invalidateQueries({ queryKey: ['user-me'] })
      queryClient.invalidateQueries({ queryKey: ['profile-completion'] })
    },
    onError: (error) => {
      console.error('Update basic info error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível atualizar as informações básicas. Tente novamente.',
        ),
      )
    },
  })
}

export function useRequestEmailChange() {
  return useMutation({
    mutationFn: async (data: { newEmail: string }) => {
      const token = getClientAuthCookie()

      if (!token) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch(Api('/users/me/request-email-change'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          rateLimited: true,
          expiresIn: errorData.expiresIn,
          message: 'Aguarde antes de solicitar um novo código.',
        }
      }

      if (response.status === 409) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData?.message || ''
        const specificMessage = parseConflictError(
          errorMessage,
          'É necessário utilizar outro e-mail.',
        )
        throw new Error(specificMessage)
      }

      if (!response.ok) {
        const message = handleHttpError(
          response,
          'Não foi possível solicitar o código de verificação. Tente novamente.',
        )
        throw new Error(message)
      }

      const result = await response.json()
      return { success: true, ...result }
    },
    onSuccess: (data) => {
      if (data.rateLimited) {
        toast.info(data.message)
      } else {
        toast.success('Código de verificação enviado para seu novo e-mail!')
      }
    },
    onError: (error) => {
      console.error('Request email change error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível solicitar o código de verificação. Tente novamente.',
        ),
      )
    },
  })
}

export function useVerifyEmailChange() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { newEmail: string; code: string }) => {
      const token = getClientAuthCookie()

      if (!token) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch(Api('/users/me/verify-email-change'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.status === 409) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData?.message || ''
        const specificMessage = parseConflictError(
          errorMessage,
          'É necessário utilizar outro e-mail.',
        )
        throw new Error(specificMessage)
      }

      if (!response.ok) {
        let errorMessage = 'Erro ao verificar código'

        if (response.status === 400) {
          errorMessage = 'Código inválido. Verifique o código digitado.'
        } else if (response.status === 401) {
          errorMessage = 'Código expirado. Solicite um novo código.'
        } else {
          const errorData = await response
            .json()
            .catch(() => ({ message: 'Erro ao verificar código' }))
          errorMessage = errorData.message || errorMessage
        }

        throw new Error(errorMessage)
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('E-mail atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['user-me'] })
    },
    onError: (error) => {
      console.error('Verify email change error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível verificar o código. Tente novamente.',
        ),
      )
    },
  })
}

export function useUpdatePassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { password: string; confirmPassword: string }) => {
      const token = getClientAuthCookie()

      if (!token) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch(Api('/users/me/password'), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      })

      if (!response.ok) {
        const message = handleHttpError(
          response,
          'Não foi possível atualizar a senha. Tente novamente.',
        )
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Senha atualizada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['user-me'] })
    },
    onError: (error) => {
      console.error('Update password error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível atualizar a senha. Tente novamente.',
        ),
      )
    },
  })
}

export function useUpdateProfile(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      city?: string
      interestSectors?: string
      interestRegion?: string
      investmentRange?: string
      role?: 'FRANCHISEE' | 'CANDIDATE' | 'ENTHUSIAST' | 'FRANCHISOR'
      franchiseeOf?: string[]
    }) => {
      const token = getClientAuthCookie()

      if (!token) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch(Api('/users/profile'), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const message = handleHttpError(
          response,
          'Não foi possível atualizar o perfil. Tente novamente.',
        )
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: (data) => {
      if (!data?.access_token) {
        toast.success('Perfil atualizado com sucesso!')
        // Recarrega dados do usuário e status de completude do perfil
        queryClient.invalidateQueries({ queryKey: ['user-me'] })
        queryClient.invalidateQueries({ queryKey: ['profile-completion'] })

        if (options?.onSuccess) {
          options.onSuccess()
        }
        return
      }

      const actualToken = data?.access_token

      if (actualToken && typeof actualToken === 'string') {
        setClientAuthCookie(actualToken)
      }

      toast.success('Perfil atualizado com sucesso!')
      // Recarrega dados do usuário e status de completude do perfil
      queryClient.invalidateQueries({ queryKey: ['user-me'] })
      queryClient.invalidateQueries({ queryKey: ['profile-completion'] })

      if (options?.onSuccess) {
        options.onSuccess()
      }
    },
    onError: (error) => {
      console.error('Update profile error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível atualizar o perfil. Tente novamente.',
        ),
      )
    },
  })
}

export function useAdminRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AdminRegisterInput) => {
      const token = getClientAuthCookie()

      if (!token) {
        throw new Error('Usuário não autenticado')
      }

      // Ensure phone is sent as raw digits only
      const sanitizedData = {
        ...data,
        phone: data.phone ? stripNonDigits(data.phone) : data.phone,
      }

      const response = await fetch(Api('/admin'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      })

      if (response.status === 409) {
        throw new Error('É necessário utilizar outro e-mail.')
      }

      if (!response.ok) {
        const message = handleHttpError(
          response,
          'Não foi possível cadastrar o administrador. Tente novamente.',
        )
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Usuário cadastrado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error) => {
      console.error('Admin register error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível cadastrar o administrador. Tente novamente.',
        ),
      )
    },
  })
}

export function useFranchisorRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: FranchisorUserRegisterInput) => {
      const token = getClientAuthCookie()

      if (!token) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch(Api('/franchisors'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.status === 409) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData?.message || ''
        const specificMessage = parseConflictError(
          errorMessage,
          'É necessário utilizar outras informações.',
        )
        throw new Error(specificMessage)
      }

      if (!response.ok) {
        const message = handleHttpError(
          response,
          'Não foi possível cadastrar o franqueador. Tente novamente.',
        )
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Usuário cadastrado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['franchisor-users'] })
    },
    onError: (error) => {
      console.error('Franchisor register error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível cadastrar o franqueador. Tente novamente.',
        ),
      )
    },
  })
}

export function useAdminUpdateBasicInfo(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string
      data: UpdateUserBasicInfoDto
    }) => {
      const token = getClientAuthCookie()

      if (!token) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch(Api(`/admin/users/${userId}`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.status === 409) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData?.message || ''
        const specificMessage = parseConflictError(
          errorMessage,
          'É necessário utilizar outro e-mail.',
        )
        throw new Error(specificMessage)
      }

      if (!response.ok) {
        const message = handleHttpError(
          response,
          'Não foi possível atualizar as informações básicas. Tente novamente.',
        )
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Informações básicas atualizadas com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['franchisee-users'] })
      queryClient.invalidateQueries({ queryKey: ['franchisor-users'] })

      if (options?.onSuccess) {
        options.onSuccess()
      }
    },
    onError: (error) => {
      console.error('Admin update basic info error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível atualizar as informações básicas. Tente novamente.',
        ),
      )
    },
  })
}

export function useAdminUpdateProfile(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string
      data: UpdateUserProfileDto
    }) => {
      const token = getClientAuthCookie()

      if (!token) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch(Api(`/admin/users/${userId}/profile`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const message = handleHttpError(
          response,
          'Não foi possível atualizar o perfil. Tente novamente.',
        )
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Perfil atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['franchisee-users'] })
      queryClient.invalidateQueries({ queryKey: ['franchisor-users'] })

      if (options?.onSuccess) {
        options.onSuccess()
      }
    },
    onError: (error) => {
      console.error('Admin update profile error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível atualizar o perfil. Tente novamente.',
        ),
      )
    },
  })
}

export function useAdminUpdateFranchisor(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string
      data: UpdateFranchisorDto
    }) => {
      const token = getClientAuthCookie()

      if (!token) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch(Api(`/admin/franchisors/${userId}`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.status === 409) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData?.message || ''
        const specificMessage = parseConflictError(
          errorMessage,
          'É necessário utilizar outro e-mail.',
        )
        throw new Error(specificMessage)
      }

      if (!response.ok) {
        const message = handleHttpError(
          response,
          'Não foi possível atualizar o franqueador. Tente novamente.',
        )
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Franqueador atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['franchisor-users'] })

      if (options?.onSuccess) {
        options.onSuccess()
      }
    },
    onError: (error) => {
      console.error('Admin update franchisor error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível atualizar o franqueador. Tente novamente.',
        ),
      )
    },
  })
}

// ============================================================================
// FORGOT PASSWORD MUTATIONS
// ============================================================================

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (data: ForgotPasswordEmailInput) => {
      const response = await fetch(Api('/auth/forgot-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      // Handle rate limiter - return special info instead of throwing error
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          rateLimited: true,
          expiresIn: errorData.expiresIn,
          message: 'Aguarde antes de solicitar um novo código.',
        }
      }

      // Security/privacy: do not reveal if the e-mail exists.
      // Some backends return 404 when the user is not found; treat as success.
      if (response.status === 404) {
        return { success: true }
      }

      if (!response.ok) {
        const message = handleHttpError(
          response,
          'Não foi possível solicitar o código de recuperação. Tente novamente.',
        )
        throw new Error(message)
      }

      const result = await response.json().catch(() => ({}))
      return { success: true, ...result }
    },
    onSuccess: (data) => {
      if (data?.rateLimited) {
        toast.info(data.message)
        return
      }

      toast.success(
        'Se este e-mail estiver cadastrado, enviaremos um link para redefinir a senha.',
      )
    },
    onError: (error) => {
      console.error('Request password reset error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível solicitar o código de recuperação. Tente novamente.',
        ),
      )
    },
  })
}

export function useVerifyResetCode() {
  return useMutation({
    mutationFn: async (data: { email: string; code: string }) => {
      const response = await fetch(Api('/auth/verify-reset-code'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        let errorMessage = 'Erro ao verificar código'

        if (response.status === 400) {
          errorMessage = 'Código inválido. Verifique o código digitado.'
        } else if (response.status === 401) {
          errorMessage = 'Código expirado. Solicite um novo código.'
        } else {
          const errorData = await response
            .json()
            .catch(() => ({ message: 'Erro ao verificar código' }))
          errorMessage = errorData.message || errorMessage
        }

        throw new Error(errorMessage)
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Código verificado com sucesso!')
    },
    onError: (error) => {
      console.error('Verify reset code error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível verificar o código. Tente novamente.',
        ),
      )
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: {
      email: string
      code: string
      password: string
      confirmPassword: string
    }) => {
      const response = await fetch(Api('/auth/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        let errorMessage = 'Erro ao redefinir senha'

        if (response.status === 400) {
          errorMessage = 'Código inválido ou senhas não coincidem.'
        } else if (response.status === 401) {
          errorMessage = 'Código expirado. Solicite um novo código.'
        } else if (response.status === 404) {
          errorMessage = 'Usuário não encontrado.'
        } else {
          const errorData = await response
            .json()
            .catch(() => ({ message: 'Erro ao redefinir senha' }))
          errorMessage = errorData.message || errorMessage
        }

        throw new Error(errorMessage)
      }

      return response.json()
    },
    onSuccess: async (data) => {
      const actualToken = data?.access_token

      if (actualToken && typeof actualToken === 'string') {
        setClientAuthCookie(actualToken)

        try {
          const validateResponse = await fetch(Api('/auth/validate'), {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${actualToken}`,
              'Content-Type': 'application/json',
            },
          })

          if (validateResponse.ok) {
            const validateResult: ValidateResponse =
              await validateResponse.json()

            if (validateResult.valid === true && validateResult.payload) {
              const { payload } = validateResult

              if (payload.isActive === false) {
                removeClientAuthCookie()
                toast.error('o usuário não está ativo', {
                  id: 'inactive-user',
                })
                return
              }

              const userRole = payload.role

              toast.success('Senha redefinida com sucesso! Redirecionando...')

              switch (userRole) {
                case 'ADMIN':
                  redirectTo('/admin')
                  break
                case 'FRANCHISOR':
                  redirectTo('/franqueador')
                  break
                case 'FRANCHISEE':
                case 'CANDIDATE':
                case 'ENTHUSIAST':
                case 'MEMBER':
                  redirectTo('/')
                  break
                default:
                  redirectTo('/')
                  break
              }
            }
          }
        } catch (validateError) {
          console.error('Error validating token:', validateError)
          toast.error('Erro na validação do usuário')
        }
      }
    },
    onError: (error) => {
      console.error('Reset password error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível redefinir a senha. Tente novamente.',
        ),
      )
    },
  })
}

export function useResendPasswordResetCode() {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await fetch(Api('/auth/resend-reset-code'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          rateLimited: true,
          expiresIn: errorData.expiresIn,
          message: 'Aguarde antes de solicitar um novo código.',
        }
      }

      if (!response.ok) {
        const message = handleHttpError(
          response,
          'Não foi possível reenviar o código. Tente novamente.',
        )
        throw new Error(message)
      }

      return { success: true }
    },
    onSuccess: (data) => {
      if (data.rateLimited) {
        toast.info(data.message)
      } else {
        toast.success('Código reenviado com sucesso!')
      }
    },
    onError: (error) => {
      console.error('Resend reset code error:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível reenviar o código. Tente novamente.',
        ),
      )
    },
  })
}
