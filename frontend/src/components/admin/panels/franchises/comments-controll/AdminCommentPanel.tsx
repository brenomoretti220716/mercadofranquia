'use client'

import Api from '@/src/api/Api'
import ReturnIcon from '@/src/components/icons/returnIcon'
import StarIcon from '@/src/components/icons/starIcon'
import ToogleButton from '@/src/components/ui/ToogleButton'
import { Review } from '@/src/schemas/franchises/Reviews'
import { formatDateToBrazilianLong } from '@/src/utils/dateFormatters'
import { getClientAuthCookie } from '@/src/utils/clientCookie'
import { useCallback, useState } from 'react'
import ModalConfirmation from '@/src/components/ui/ModalConfirmation'

interface AdminCommentPanelProps {
  reviews: Review[]
  franchiseName: string
  onToggleReviewStatus?: (reviewId: number, isActive: boolean) => void
}

export default function AdminCommentPanel({
  reviews,
  franchiseName,
  onToggleReviewStatus,
}: AdminCommentPanelProps) {
  const [loadingReviews, setLoadingReviews] = useState<Set<number>>(new Set())
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    reviewId: number | null
    currentStatus: boolean
  }>({
    isOpen: false,
    reviewId: null,
    currentStatus: false,
  })

  const renderStars = useCallback((rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <StarIcon
          key={i}
          color={i <= rating ? '#E25E3E' : '#B4B4B4'}
          filled={true}
        />,
      )
    }
    return stars
  }, [])

  const formatDate = formatDateToBrazilianLong

  const handleOpenModal = (reviewId: number, currentStatus: boolean) => {
    setModalState({
      isOpen: true,
      reviewId,
      currentStatus,
    })
  }

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      reviewId: null,
      currentStatus: false,
    })
  }

  const handleConfirmToggle = async () => {
    if (!modalState.reviewId) return

    const reviewId = modalState.reviewId
    const currentStatus = modalState.currentStatus
    const newStatus = !currentStatus
    const action = newStatus ? 'ativar' : 'desativar'

    setLoadingReviews((prev) => new Set(prev).add(reviewId))

    try {
      const response = await fetch(Api(`/reviews/${reviewId}/toggle-status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getClientAuthCookie()}`,
        },
        body: JSON.stringify({ isActive: newStatus }),
      })

      if (response.ok) {
        if (onToggleReviewStatus) {
          onToggleReviewStatus(reviewId, newStatus)
        }
        handleCloseModal()
      } else {
        const errorData = await response.json()
        alert(
          `Erro ao ${action} comentário: ${errorData.message || 'Erro desconhecido'}`,
        )
      }
    } catch (error) {
      console.error(`Erro ao ${action} review:`, error)
      alert(`Erro ao ${action} comentário`)
    } finally {
      setLoadingReviews((prev) => {
        const newSet = new Set(prev)
        newSet.delete(reviewId)
        return newSet
      })
    }
  }

  return (
    <>
      <div className="flex flex-col m-10 rounded-2xl">
        <div className="flex flex-col w-full rounded-2xl p-10 bg-[#FFFFFF]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-manrope font-extrabold text-2xl">
              Depoimentos e avaliações
            </h2>
            <div className="text-sm text-gray-600">
              {reviews.length}{' '}
              {reviews.length === 1 ? 'avaliação' : 'avaliações'}
            </div>
          </div>

          <div>
            {reviews.length > 0 ? (
              <div className="flex flex-col gap-8">
                {[...reviews]
                  .sort((a, b) => {
                    // Primeiro critério: franqueados primeiro
                    if (a.isFranchisee && !b.isFranchisee) return -1
                    if (!a.isFranchisee && b.isFranchisee) return 1

                    // Segundo critério: data (mais recentes primeiro)
                    return (
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                    )
                  })
                  .map((review) => (
                    <div
                      key={review.id}
                      className={`p-5 rounded-lg ${!review.isActive ? 'opacity-50' : ''}`}
                    >
                      {!review.isActive && (
                        <div className="flex justify-start">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Comentário Inativo
                          </span>
                        </div>
                      )}

                      {/* Destaque para franqueados */}
                      {review.isFranchisee && (
                        <div className="mb-3 flex items-center gap-2">
                          <div className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-sm flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-sm"></span>
                            Franqueado
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex flex-col gap-2">
                            <h3 className="font-manrope font-bold text-xl">
                              {review.anonymous
                                ? 'Usuário Anônimo'
                                : review.authorName}
                            </h3>
                            <p className="text-gray-600">
                              {formatDate(review.createdAt)}
                            </p>
                          </div>

                          <div className="flex ml-10 gap-10 items-center">
                            <div className="flex">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center">
                          {onToggleReviewStatus && (
                            <ToogleButton
                              isActive={review.isActive}
                              isUpdating={false}
                              isTogglingStatus={loadingReviews.has(review.id)}
                              handleOpenToggleModal={() =>
                                handleOpenModal(review.id, review.isActive)
                              }
                            />
                          )}
                        </div>
                      </div>

                      <div className="p-4">
                        <p className="text-gray-800 leading-relaxed">
                          {review.comment}
                        </p>
                      </div>

                      {review.responses && review.responses.length > 0 ? (
                        <div className="ml-6">
                          {review.responses.map((response) => (
                            <div
                              key={response.id}
                              className="flex items-start gap-3 mb-4"
                            >
                              <div className="flex mt-1">
                                <ReturnIcon color="#E25E3E" />
                              </div>
                              <div className="flex flex-col gap-2 flex-1">
                                <h3 className="font-bold text-[#E25E3E]">
                                  [{franchiseName}] respondeu:
                                </h3>
                                <div className="bg-orange-50 rounded-lg p-4">
                                  <p className="text-gray-700">
                                    {response.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 ml-6">
                          <div className="flex mt-1">
                            <ReturnIcon color="#E25E3E" />
                          </div>
                          <div className="flex flex-col gap-2 flex-1">
                            <div className="bg-orange-50 rounded-lg p-4">
                              <p className="text-gray-700">
                                Nenhuma resposta da franquia ainda.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <StarIcon color="#9CA3AF" filled={false} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma avaliação ainda
                </h3>
                <p className="text-gray-600 max-w-md">
                  Esta franquia ainda não recebeu avaliações. As avaliações dos
                  clientes aparecerão aqui.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalConfirmation
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmToggle}
        isLoading={
          modalState.reviewId ? loadingReviews.has(modalState.reviewId) : false
        }
        text={
          modalState.currentStatus
            ? 'Inativar este depoimento fará com que ele não apareça mais no perfil da franquia e não seja visível para os usuários.'
            : 'Ativar este depoimento fará com que ele volte a aparecer no perfil da franquia e seja visível para todos os usuários.'
        }
        buttonText={
          modalState.currentStatus
            ? 'Desativar Comentário'
            : 'Ativar Comentário'
        }
        action={modalState.currentStatus ? 'desativar' : 'ativar'}
      />
    </>
  )
}
