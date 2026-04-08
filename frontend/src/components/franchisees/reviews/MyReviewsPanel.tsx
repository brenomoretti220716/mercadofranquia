'use client'

import { useMemo } from 'react'

import ReturnIcon from '@/src/components/icons/returnIcon'
import StarIcon from '@/src/components/icons/starIcon'
import FormSelect from '@/src/components/ui/FormSelect'
import { Pagination } from '@/src/components/ui/Pagination'
import { useMyReviews } from '@/src/hooks/reviews/useMyReviews'
import { formatDateToBrazilianLong } from '@/src/utils/dateFormatters'

const SORT_OPTIONS = [
  { label: 'Mais recentes', value: 'review' as const },
  { label: 'Respostas mais recentes', value: 'response' as const },
]

export default function MyReviewsPanel() {
  const {
    reviews,
    pagination,
    sortBy,
    handlePageChange,
    handleSortChange,
    isLoading,
    isFetching,
    isError,
    error,
    isAuthenticated,
    isValidating,
    refetch,
  } = useMyReviews()

  const hasReviews = reviews.length > 0

  const errorMessage = useMemo(() => {
    if (!error) return null

    const status = (error as { status?: number })?.status
    if (status === 401) {
      return 'Sua sessão expirou. Faça login novamente para ver seus depoimentos.'
    }
    if (status === 404) {
      return 'Usuário não encontrado. Entre em contato com o suporte.'
    }
    return 'Não foi possível carregar seus depoimentos. Tente novamente em instantes.'
  }, [error])

  if (isValidating || !isAuthenticated) {
    return null
  }

  return (
    <section
      id="my-reviews-panel"
      className="relative flex flex-col rounded-2xl"
    >
      <div className="flex flex-col w-full rounded-2xl p-6 md:p-10">
        <header className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between md:items-center mb-6 md:mb-8">
          <div>
            <h2 className="font-manrope font-extrabold text-2xl">
              Meus depoimentos
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Veja as avaliações que você já compartilhou com a comunidade.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Ordenar por</span>
            <div className="min-w-[220px]">
              <FormSelect
                name="myReviewsSort"
                options={SORT_OPTIONS}
                value={sortBy}
                onChange={(event) =>
                  handleSortChange(event.target.value as 'review' | 'response')
                }
              />
            </div>
          </div>
        </header>

        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E25E3E]" />
              Carregando depoimentos...
            </div>
          </div>
        )}

        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
            <p className="text-red-500 text-base font-medium">{errorMessage}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!isLoading && !isError && !hasReviews && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-gray-500 text-lg mb-3">
              Você ainda não compartilhou nenhum depoimento.
            </p>
            <p className="text-gray-400 text-sm">
              Assim que você fizer um review, ele aparecerá aqui.
            </p>
          </div>
        )}

        {!isLoading && hasReviews && (
          <div className="flex flex-col gap-8">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="p-5 rounded-xl bg-white shadow-sm border border-gray-100"
              >
                <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-manrope font-bold text-xl">
                        {review.anonymous
                          ? 'Usuário Anônimo'
                          : review.author.name}
                      </h3>
                      {review.isFranchisee && (
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-sm">
                          Franqueado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDateToBrazilianLong(review.createdAt)}
                      {' • '}
                      {review.franchise.name}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <StarIcon
                        key={index}
                        color={index < review.rating ? '#E25E3E' : '#B4B4B4'}
                        filled={true}
                        width={16}
                        height={16}
                      />
                    ))}
                  </div>
                </header>

                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-6">
                  {review.comment}
                </p>

                <div className="flex flex-col gap-4">
                  {review.responses.length > 0 ? (
                    review.responses.map((response) => (
                      <div
                        key={response.id}
                        className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border-l-4 border-[#E25E3E]"
                      >
                        <div className="flex-shrink-0">
                          <ReturnIcon color="#E25E3E" />
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                          <h4 className="font-bold text-[#E25E3E] text-sm">
                            Resposta de {review.franchise.name}
                          </h4>
                          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                            {response.content}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDateToBrazilianLong(response.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                      <div className="flex-shrink-0">
                        <ReturnIcon color="#6B7280" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <h4 className="font-bold text-gray-600 text-sm">
                          Resposta do franqueador
                        </h4>
                        <p className="text-gray-500 text-sm italic">
                          Ainda não há resposta para este depoimento.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}

            <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                {`Exibindo ${reviews.length} de ${pagination.total} depoimentos`}
                {isFetching && (
                  <span className="ml-2 text-gray-400">Atualizando…</span>
                )}
              </div>

              <Pagination
                page={pagination.page}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={handlePageChange}
                scrollToId="my-reviews-panel"
                scrollMarginTop={80}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
