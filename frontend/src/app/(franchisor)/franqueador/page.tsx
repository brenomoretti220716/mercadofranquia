'use client'

import { useAuth } from '@/src/hooks/users/useAuth'

export default function FranchisorContent() {
  const { isValidating, payload } = useAuth()

  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-lg text-foreground">
            Verificando autenticação...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="m-4 sm:m-6 md:m-10 p-6 sm:p-8 md:p-10 bg-white rounded-2xl shadow-sm border border-border/50">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-foreground">
        Área do Franqueador
      </h1>
      <p className="text-base sm:text-lg mb-4 text-foreground">
        Bem-vindo à área exclusiva para franqueadores!
      </p>
      <p className="text-muted-foreground">Olá, {payload?.name}!</p>
    </div>
  )
}
