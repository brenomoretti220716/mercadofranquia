'use client'

import { useFranchisorFranchisesQuery } from '@/src/hooks/franchises/useFranchises'
import type { Franchise } from '@/src/schemas/franchises/Franchise'
import { useAuth } from '@/src/hooks/users/useAuth'
import FranchiseEditDetails from '@/src/components/shared/franchise-edit/FranchiseEditDetails'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import FranchisorCommentPanel from './FranchisorCommentPanel'

function FranchisorFranchisesSection({
  token,
  userId,
}: {
  token: string
  userId: string
}) {
  const [selectedFranchiseId, setSelectedFranchiseId] = useQueryState(
    'franchise',
    parseAsString.withDefault(''),
  )

  const { franchises, isLoading, isError } = useFranchisorFranchisesQuery(
    userId,
    token,
  )

  useEffect(() => {
    if (franchises.length > 0) {
      if (
        !selectedFranchiseId ||
        !franchises.find((f) => f.slug === selectedFranchiseId)
      ) {
        setSelectedFranchiseId(franchises[0].slug)
      }
    }
  }, [franchises, selectedFranchiseId, setSelectedFranchiseId])

  const handleBackToHome = () => {
    window.location.href = '/franqueador'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground text-lg">Carregando...</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] m-4 sm:m-6 md:m-10 text-center">
        <div className="text-4xl mb-4">⏳</div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Sua franquia está em análise
        </h2>
        <p className="text-muted-foreground text-base max-w-md mb-6">
          Sua franquia ainda não foi aprovada pela nossa equipe. Assim que for
          aprovada, você terá acesso completo ao painel do franqueador.
        </p>
        <button
          onClick={handleBackToHome}
          className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
        >
          Voltar ao início
        </button>
      </div>
    )
  }

  if (franchises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] m-4 sm:m-6 md:m-10">
        <div className="text-muted-foreground text-lg mb-4">
          Você não possui franquias cadastradas
        </div>
        <button
          onClick={handleBackToHome}
          className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
        >
          Voltar ao início
        </button>
      </div>
    )
  }

  const selectedFranchise = franchises.find(
    (f) => f.slug === selectedFranchiseId,
  )

  return (
    <>
      {selectedFranchise && (
        <FranchiseDetails franchise={selectedFranchise} token={token} />
      )}
    </>
  )
}

function FranchiseDetails({
  franchise,
  token,
}: {
  franchise: Franchise
  token: string
}) {
  return (
    <>
      <FranchiseEditDetails franchise={franchise} token={token} />

      {/* CommentPanel com franquia selecionada */}
      <FranchisorCommentPanel key={franchise.slug} />
    </>
  )
}

export default function FranchisorSelectedFranchise() {
  const { payload, token } = useAuth()

  // Early return se não tiver token ou user
  if (!token || !payload) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] m-4 sm:m-6 md:m-10">
        <div className="text-muted-foreground text-lg mb-4">
          Acesso não autorizado
        </div>
      </div>
    )
  }

  return <FranchisorFranchisesSection token={token} userId={payload.id} />
}
