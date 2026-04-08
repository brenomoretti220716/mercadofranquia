'use client'

import ReturnIcon from '@/src/components/icons/returnIcon'
import StarIcon from '@/src/components/icons/starIcon'
import { Pagination } from '@/src/components/ui/Pagination'
import { useFranchisorFranchisesQuery } from '@/src/hooks/franchises/useFranchises'
import { useCreateReviewResponse } from '@/src/hooks/reviews/useReviewMutations'
import { useAuth } from '@/src/hooks/users/useAuth'
import { reviewQueries } from '@/src/queries/reviews'
import { Franchise } from '@/src/schemas/franchises/Franchise'
import { formatDateToBrazilianLong } from '@/src/utils/dateFormatters'
import { useQuery } from '@tanstack/react-query'
import { useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'

export default function FranchisorCommentPanel() {
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null)
  const [responseText, setResponseText] = useState('')
  const [page, setPage] = useState(1)
  const limit = 4
  const { payload, token } = useAuth()
  const [selectedFranchiseId, setSelectedFranchiseId] = useQueryState<
    string | null
  >('franchise', {
    history: 'replace',
    parse: (v) => v ?? null,
    serialize: (v) => v ?? '',
  })

  // Buscar franquias do franqueador
  const {
    franchises,
    isLoading: isLoadingFranchises,
    error: franchisesError,
  } = useFranchisorFranchisesQuery(payload?.id || '', token || undefined)

  // Garantir que sempre haja um selectedFranchiseId válido na URL
  useEffect(() => {
    if (franchises.length > 0) {
      if (
        !selectedFranchiseId ||
        !franchises.some((f) => f.slug === selectedFranchiseId)
      ) {
        setSelectedFranchiseId(franchises[0].slug)
      }
    }
  }, [franchises, selectedFranchiseId, setSelectedFranchiseId])

  // Mutation para criar resposta
  const createResponseMutation = useCreateReviewResponse(
    selectedFranchiseId || undefined,
  )

  const handleReplyClick = (reviewId: number) => {
    if (activeReplyId === reviewId) {
      setActiveReplyId(null)
      setResponseText('')
    } else {
      setActiveReplyId(reviewId)
      setResponseText('')
    }
  }

  const handleSubmitResponse = (reviewId: number) => {
    if (!responseText.trim() || !token) return

    createResponseMutation.mutate({
      reviewId,
      content: responseText.trim(),
      token,
    })
    setResponseText('')
    setActiveReplyId(null)
  }

  const handleCancelReply = () => {
    setActiveReplyId(null)
    setResponseText('')
  }

  // Renderizar estrelas baseado na avaliação
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <StarIcon
        key={index}
        color={
          index < rating ? 'hsl(10 79% 57%)' : 'hsl(var(--muted-foreground))'
        }
        filled={true}
        width={16}
        height={16}
      />
    ))
  }

  // Encontrar a franquia selecionada para mostrar o nome
  const selectedFranchise = franchises.find(
    (f: Franchise) => f.slug === selectedFranchiseId,
  )

  const selectedFranchiseSlug = selectedFranchise?.slug

  // Buscar reviews da franquia selecionada, usando o slug (identificador esperado pelo backend)
  const {
    data: reviewsPage,
    isLoading: isLoadingReviews,
    error: reviewsError,
    refetch,
  } = useQuery({
    ...reviewQueries.byFranchisePaginated(
      selectedFranchiseSlug!,
      page,
      limit,
      token!,
    ),
    enabled: !!selectedFranchiseSlug && !!token,
  })

  const reviews = reviewsPage?.data ?? []
  const total = reviewsPage?.total ?? reviews.length

  // Formatar data (imported from utils)
  const formatDate = formatDateToBrazilianLong

  // Sempre que trocar de franquia, voltar para a primeira página
  useEffect(() => {
    setPage(1)
  }, [selectedFranchiseId])

  if (payload?.role !== 'FRANCHISOR') {
    return (
      <div className="flex flex-col m-4 sm:m-6 md:m-10 rounded-2xl">
        <div className="flex flex-col w-full rounded-2xl p-4 sm:p-6 md:p-10 bg-white shadow-sm border border-border/50">
          <div className="text-center text-muted-foreground">
            Acesso negado. Apenas franqueadores podem acessar esta área.
          </div>
        </div>
      </div>
    )
  }

  // Loading franchises
  if (isLoadingFranchises) {
    return (
      <div className="flex flex-col m-4 sm:m-6 md:m-10 rounded-2xl">
        <div className="flex flex-col w-full rounded-2xl p-4 sm:p-6 md:p-10 bg-white shadow-sm border border-border/50">
          <div className="flex justify-center items-center py-8">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">
                Carregando suas franquias...
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error loading franchises
  if (franchisesError) {
    return (
      <div className="flex flex-col m-4 sm:m-6 md:m-10 rounded-2xl">
        <div className="flex flex-col w-full rounded-2xl p-4 sm:p-6 md:p-10 bg-white shadow-sm border border-border/50">
          <div className="text-center text-destructive mb-4">
            Erro ao carregar franquias: {franchisesError.message}
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Usuário: {payload?.name} (ID: {payload?.id}) | Role: {payload?.role}
          </div>
        </div>
      </div>
    )
  }

  // No franchises found
  if (franchises.length === 0) {
    return (
      <div className="flex flex-col m-4 sm:m-6 md:m-10 rounded-2xl">
        <div className="flex flex-col w-full rounded-2xl p-4 sm:p-6 md:p-10 bg-white shadow-sm border border-border/50">
          <div className="text-center text-muted-foreground mb-4">
            Você não possui franquias cadastradas.
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Usuário: {payload?.name} (ID: {payload?.id}) | Role: {payload?.role}
          </div>
        </div>
      </div>
    )
  }

  // No franchise selected (shouldn't happen)
  if (!selectedFranchiseId || !selectedFranchise) {
    return (
      <div className="flex flex-col m-4 sm:m-6 md:m-10 rounded-2xl">
        <div className="flex flex-col w-full rounded-2xl p-4 sm:p-6 md:p-10 bg-white shadow-sm border border-border/50">
          <div className="text-center text-muted-foreground">
            Carregando dados da franquia...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      id="franchisor-reviews-panel"
      className="flex flex-col m-4 sm:m-6 md:m-10 rounded-2xl"
    >
      {/* Conteúdo dos comentários */}
      <div className="flex flex-col w-full rounded-2xl p-4 sm:p-6 md:p-10 bg-white shadow-sm border border-border/50">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
          <div className="flex flex-col">
            <h2 className="font-manrope font-extrabold text-2xl text-foreground">
              Depoimentos e avaliações
            </h2>
          </div>
        </div>

        {/* Loading reviews */}
        {isLoadingReviews && (
          <div className="flex justify-center items-center py-8">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">
                Carregando depoimentos...
              </span>
            </div>
          </div>
        )}

        {/* Reviews ou estado vazio */}
        {!isLoadingReviews && (
          <div className="flex flex-col gap-8">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-border-200 pb-6 last:border-b-0"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-2">
                        <h3 className="font-manrope font-bold text-xl text-foreground">
                          {review.anonymous
                            ? 'Usuário Anônimo'
                            : review.authorName}
                        </h3>
                        <p className="font-manrope text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>

                    {/* Botão de responder */}
                    {(!review.responses || review.responses.length === 0) && (
                      <button
                        onClick={() => handleReplyClick(review.id)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-orange-50 rounded-lg transition-colors"
                        disabled={createResponseMutation.isPending}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Responder
                      </button>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {review.comment}
                    </p>
                  </div>

                  {/* Respostas existentes */}
                  {review.responses && review.responses.length > 0 && (
                    <div className="ml-4 mb-4">
                      {review.responses.map((response) => (
                        <div
                          key={response.id}
                          className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border-l-4 border-primary mb-3"
                        >
                          <div className="flex-shrink-0">
                            <ReturnIcon color="hsl(10 79% 57%)" />
                          </div>
                          <div className="flex flex-col gap-2 w-full">
                            <h4 className="font-bold text-primary text-sm">
                              Resposta de {selectedFranchise.name}:
                            </h4>

                            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                              {response.content}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {formatDate(response.createdAt)}
                              {response.updatedAt !== response.createdAt &&
                                ' (editado)'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Área de resposta inline */}
                  {activeReplyId === review.id && (
                    <div className="ml-4 mt-4">
                      <div className="flex items-start gap-3 p-4 bg-secondary-50 rounded-lg border-l-4 border-border-300">
                        <div className="flex-shrink-0">
                          <ReturnIcon color="#6B7280" />
                        </div>
                        <div className="flex flex-col gap-3 w-full">
                          <h4 className="font-bold text-muted-foreground text-sm">
                            Sua resposta:
                          </h4>

                          <div className="flex gap-3 w-full">
                            <textarea
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              placeholder="Digite sua resposta ao depoimento..."
                              className="flex-1 p-3 border border-border-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              rows={3}
                              minLength={10}
                              maxLength={500}
                              disabled={createResponseMutation.isPending}
                            />

                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => handleSubmitResponse(review.id)}
                                disabled={
                                  !responseText.trim() ||
                                  createResponseMutation.isPending ||
                                  responseText.length < 10
                                }
                                className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {createResponseMutation.isPending ? (
                                  <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Enviando...</span>
                                  </div>
                                ) : (
                                  'Enviar'
                                )}
                              </button>

                              <button
                                onClick={handleCancelReply}
                                disabled={createResponseMutation.isPending}
                                className="px-4 py-2 bg-secondary-200 text-foreground text-sm rounded-lg hover:bg-secondary-300 disabled:opacity-50 transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>

                          <div className="text-sm text-muted-foreground text-right">
                            {responseText.length}/500 caracteres
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-muted-foreground text-lg mb-4">
                  Ainda não há depoimentos para esta franquia
                </div>
                <p className="text-muted-foreground/70 mb-6">
                  Os depoimentos dos franqueados aparecerão aqui quando forem
                  publicados.
                </p>
                <div className="text-xs text-muted-foreground/70">
                  Franquia: {selectedFranchise.name} (ID: {selectedFranchiseId})
                </div>
              </div>
            )}

            {/* Error state para reviews */}
            {reviewsError && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="text-destructive text-center mb-4">
                  Erro ao carregar depoimentos: {reviewsError.message}
                </div>
                <div className="text-xs text-muted-foreground/70 mb-4">
                  Franquia ID: {selectedFranchiseId}
                </div>
                <button
                  onClick={() => refetch()}
                  className="px-4 py-2 bg-secondary-200 text-foreground rounded-lg hover:bg-secondary-300 transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            <Pagination
              page={page}
              total={total}
              limit={limit}
              onPageChange={setPage}
              scrollToId="franchisor-reviews-panel"
            />
          </div>
        )}
      </div>
    </div>
  )
}
