'use client'

import { useAuth, isAdmin } from '@/src/hooks/users/useAuth'

export default function AdminContent() {
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

  if (isValidating || !isAdmin(payload)) {
    return null
  }

  return (
    <div className="m-10 p-10 bg-white rounded-2xl shadow-sm border border-border/50">
      <h1 className="text-3xl font-bold mb-4 text-foreground">
        Painel Administrativo
      </h1>
      <p className="text-lg mb-4 text-foreground">
        Bem-vindo ao painel administrativo!
      </p>
      <p className="text-muted-foreground">Olá, {payload?.name}!</p>
    </div>
  )
}
