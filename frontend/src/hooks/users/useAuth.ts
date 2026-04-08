'use client'

import { AuthContext } from '@/src/contexts/AuthContext'
import { Payload } from '@/src/schemas/auth/auth'
import { removeClientAuthCookie } from '@/src/utils/clientCookie'
import { redirectToLogin, validateJWT } from '@/src/utils/validate-jwt'
import { useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

export function useAuth(revalidateKey: number = 0) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isValidating, setIsValidating] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [payload, setPayload] = useState<Payload | null>(null)

  useEffect(() => {
    async function checkAuth() {
      try {
        const result = await validateJWT()

        if (result.isValid && result.payload) {
          const userIsActive = result.payload.isActive === true

          if (userIsActive) {
            setIsAuthenticated(true)
            setToken(result.token)
            setPayload(result.payload)
          } else {
            setIsAuthenticated(false)
            setToken(null)
            setPayload(null)
            removeClientAuthCookie()

            toast.error('o usuário não está ativo')

            setTimeout(() => {
              redirectToLogin()
            }, 2000)

            return
          }
        } else {
          console.log('Invalid token or no user found')
          setIsAuthenticated(false)
          setIsValidating(false)
          setToken(null)
          setPayload(null)
          return
        }

        setIsValidating(false)
      } catch (error) {
        setIsAuthenticated(false)
        setToken(null)
        setPayload(null)
        setIsValidating(false)
        throw error instanceof Error
          ? error
          : new Error('Erro ao validar token')
      }
    }

    checkAuth()
  }, [revalidateKey])

  return {
    isAuthenticated,
    isValidating,
    token,
    payload,
  }
}

export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  return {
    isLoggingOut,
    handleLogout,
  }

  function handleLogout() {
    try {
      setIsLoggingOut(true)
      removeClientAuthCookie()
      toast.success('Logout realizado com sucesso!')
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
    } catch (error) {
      console.error('Erro ao fazer logout: ', error)
      toast.error('Erro ao fazer o Logout')
    } finally {
      setIsLoggingOut(false)
    }
  }
}

export function isAdmin(user: Payload | null) {
  return user?.role === 'ADMIN'
}

export function isFranchisee(user: Payload | null) {
  return user?.role === 'FRANCHISEE'
}

export function isCandidate(user: Payload | null) {
  return user?.role === 'CANDIDATE'
}

export function isFranchisor(user: Payload | null) {
  return user?.role === 'FRANCHISOR'
}

export function isMember(user: Payload | null) {
  return user?.role === 'MEMBER'
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within HeaderProvider')
  }
  return context
}
