import { createContext, useCallback, useState } from 'react'
import { useAuth } from '../hooks/users/useAuth'
import { Payload } from '../schemas/auth/auth'

interface AuthContextType {
  isAuthenticated: boolean
  payload: Payload
  isValidating: boolean
  revalidate: () => void
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [revalidateKey, setRevalidateKey] = useState(0)
  const { isAuthenticated, payload, isValidating } = useAuth(revalidateKey)

  const revalidate = useCallback(() => {
    setRevalidateKey((prev) => prev + 1)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isValidating,
        payload: payload as Payload,
        revalidate,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
