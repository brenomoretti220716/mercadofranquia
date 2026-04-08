'use client'

import ReturnIcon from '@/src/components/icons/returnIcon'
import StarIcon from '@/src/components/icons/starIcon'
import BaseModal from '@/src/components/ui/BaseModal'
import ModalIncompleteProfile from '@/src/components/ui/ModalIncompleteProfile'
import ModalRedirectLogin from '@/src/components/ui/ModalRedirectLogin'
import RoundedButton from '@/src/components/ui/RoundedButton'
import { Pagination } from '@/src/components/ui/Pagination'
import { isAdmin, isFranchisor, useAuth } from '@/src/hooks/users/useAuth'
import { reviewQueries } from '@/src/queries/reviews'
import { useProfileCompletion } from '@/src/hooks/users/useProfileCompletion'
import { Review } from '@/src/schemas/franchises/Reviews'
import { formatDateToBrazilianLong } from '@/src/utils/dateFormatters'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import AddComment from './AddComment'

interface CommentPanelProps {
  franchiseId: string
  isReview: boolean
}

export default function CommentPanel({
  franchiseId,
  isReview,
}: CommentPanelProps) {
  const [page, setPage] = useState(1)
  const limit = 4
  const [isOpen, setIsOpen] = useState(false)
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isIncompleteProfileModalOpen, setIsIncompleteProfileModalOpen] =
    useState(false)
  const [userEmail, setUserEmail] = useState('')

  const { isAuthenticated, payload } = useAuth()
  const { data: profileCompletion } = useProfileCompletion(isAuthenticated)

  // Buscar reviews sempre (todos podem ver)
  const {
    data: reviewsPage,
    error,
    refetch,
  } = useQuery({
    ...reviewQueries.byFranchisePaginated(franchiseId, page, limit),
    enabled: !!franchiseId,
  })

  const reviews: Review[] = (reviewsPage?.data as Review[]) || []
  const total = reviewsPage?.total ?? reviews.length

  const isOpenModal = () => {
    // Check if user is not authenticated - show login modal
    if (!isAuthenticated) {
      setIsLoginModalOpen(true)
      return
    }

    // Check if user is admin (admins cannot create reviews)
    if (isAdmin(payload)) {
      return // Do nothing - admins cannot create reviews
    }

    // Check if profile is complete
    if (profileCompletion && !profileCompletion.isComplete) {
      setIsIncompleteProfileModalOpen(true)
      return
    }

    // For authenticated users with complete profile, show the review form
    setIsOpen(true)
  }

  function onCloseModal() {
    setIsOpen(false)
  }

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false)
  }

  const handleCloseIncompleteProfileModal = () => {
    setIsIncompleteProfileModalOpen(false)
  }

  const handleCommentSuccess = useCallback(() => {
    refetch()
    onCloseModal()
    setIsCodeModalOpen(false)
  }, [refetch])

  const handleShowCodeModal = useCallback((email: string) => {
    setUserEmail(email)
    setIsOpen(false)
    setIsCodeModalOpen(true)
  }, [])

  const handleCloseCodeModal = useCallback(() => {
    setIsCodeModalOpen(false)
  }, [])

  const handleBackToForm = useCallback(() => {
    setIsCodeModalOpen(false)
    setIsOpen(true)
  }, [])

  // Renderizar estrelas baseado na avaliação
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <StarIcon
        key={index}
        color={index < rating ? '#E25E3E' : '#B4B4B4'}
        filled={true}
        width={16}
        height={16}
      />
    ))
  }

  // Formatar data (imported from utils)
  const formatDate = formatDateToBrazilianLong

  const renderReviews = () => {
    if (total === 0) {
      return (
        <div className="flex flex-col items-center py-8 sm:py-12 text-center">
          <div className="text-gray-500 text-base sm:text-lg mb-3 sm:mb-4 px-4">
            Ainda não há depoimentos para esta franquia
          </div>

          {isReview && !isAdmin(payload) && !isFranchisor(payload) && (
            <RoundedButton
              text="Adicionar primeiro depoimento"
              onClick={isOpenModal}
              color="#E25E3E"
              textColor="white"
            />
          )}
        </div>
      )
    }

    // Ordenar reviews locais: franqueados primeiro, depois por data (mais recentes primeiro)
    const sortedReviews = [...reviews].sort((a, b) => {
      // Primeiro critério: franqueados primeiro
      if (a.isFranchisee && !b.isFranchisee) return -1
      if (!a.isFranchisee && b.isFranchisee) return 1

      // Segundo critério: data (mais recentes primeiro)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return sortedReviews.map((review) => (
      <div key={review.id} className="p-4 sm:p-5">
        {/* Destaque para franqueados */}
        {review.isFranchisee && (
          <div className="mb-3 flex items-center gap-2">
            <div className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-sm flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-sm"></span>
              Franqueado
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
          <div className="flex flex-col gap-1 sm:gap-2 flex-1">
            <h3 className="font-manrope font-bold text-lg sm:text-xl">
              {review.anonymous ? 'Usuário Anônimo' : review.authorName}
            </h3>
            <p className="font-manrope text-gray-600 text-sm sm:text-base">
              {formatDate(review.createdAt)}
            </p>
          </div>

          <div className="flex gap-1 sm:ml-auto">
            {renderStars(review.rating)}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
            {review.comment}
          </p>
        </div>

        {/* Respostas do franqueador */}
        {review.responses && review.responses.length > 0 && (
          <div className="ml-2 sm:ml-4 mb-4">
            {review.responses.map((response) => (
              <div
                key={response.id}
                className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-orange-50 rounded-lg border-l-4 border-[#E25E3E] mb-3"
              >
                <div className="flex-shrink-0">
                  <ReturnIcon color="#E25E3E" />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <h4 className="font-bold text-[#E25E3E] text-xs sm:text-sm">
                    Resposta de {review.franchise?.name || 'Franquia'}:
                  </h4>

                  <p className="text-gray-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {response.content}
                  </p>

                  <p className="text-xs text-gray-500">
                    {formatDate(response.createdAt)}
                    {response.updatedAt !== response.createdAt && ' (editado)'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Placeholder para quando não há resposta */}
        {(!review.responses || review.responses.length === 0) && (
          <div className="flex items-start gap-2 sm:gap-3 ml-2 sm:ml-4 p-3 sm:p-4 bg-gray-50 rounded-lg border-l-4 border-gray-300">
            <div className="flex-shrink-0">
              <ReturnIcon color="#6B7280" />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="font-bold text-gray-600 text-xs sm:text-sm">
                Resposta do Franqueador:
              </h4>
              <p className="text-gray-500 text-xs sm:text-sm italic">
                Aguardando resposta do franqueador...
              </p>
            </div>
          </div>
        )}
      </div>
    ))
  }

  return (
    <>
      <ModalRedirectLogin
        isOpen={isLoginModalOpen}
        onClose={handleCloseLoginModal}
      />
      <ModalIncompleteProfile
        isOpen={isIncompleteProfileModalOpen}
        onClose={handleCloseIncompleteProfileModal}
      />

      <BaseModal
        tittleText="Queremos conhecer sua experiência como franqueado!"
        subtittleText="Compartilhe como tem sido sua jornada com a franquia, os aprendizados, desafios superados e conquistas alcançadas. Seu depoimento pode ajudar outros empreendedores a tomar decisões mais conscientes."
        isOpen={isOpen}
        onClose={onCloseModal}
      >
        <AddComment
          onClose={onCloseModal}
          onSuccess={handleCommentSuccess}
          onShowCodeModal={handleShowCodeModal}
          franchiseId={franchiseId}
        />
      </BaseModal>

      {/* Modal do código de verificação */}
      <BaseModal
        tittleText="Digite o código de verificação"
        subtittleText="Digite o código de verificação que você recebeu por e-mail"
        isOpen={isCodeModalOpen}
        onClose={handleCloseCodeModal}
      >
        <AddComment
          onClose={handleCloseCodeModal}
          onSuccess={handleCommentSuccess}
          onShowCodeModal={handleShowCodeModal}
          onBack={handleBackToForm}
          franchiseId={franchiseId}
          isCodeModal={true}
          userEmail={userEmail}
        />
      </BaseModal>

      {/* ✅ Container principal com posicionamento relativo */}
      <div className="relative flex flex-col m-4 sm:m-5 md:m-10 rounded-2xl">
        {/* ✅ Conteúdo principal */}
        <div className="flex flex-col w-full rounded-2xl p-5 sm:p-6 md:p-10 bg-[#FFFFFF]">
          <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-start md:items-center">
            <div className="flex flex-col">
              <h2 className="font-manrope font-extrabold text-xl sm:text-2xl">
                Depoimentos e avaliações
              </h2>
            </div>

            {isReview &&
              !isAdmin(payload) &&
              !isFranchisor(payload) &&
              reviews.length > 0 && (
                <RoundedButton
                  text="Adicionar depoimento"
                  onClick={isOpenModal}
                  color="#E25E3E"
                  textColor="white"
                />
              )}
          </div>

          {/* ✅ Reviews - sempre mostrar */}
          <div
            className="flex flex-col gap-6 md:gap-8"
            id="franchise-reviews-panel"
          >
            {renderReviews()}

            {/* Error state para reviews */}
            {error && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="text-red-500 text-center mb-4">
                  Erro ao carregar depoimentos: {error.message}
                </div>
                <div className="text-xs text-gray-400 mb-4">
                  Franquia ID: {franchiseId}
                </div>
                <button
                  onClick={() => refetch()}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>

          <Pagination
            page={page}
            total={total}
            limit={limit}
            onPageChange={setPage}
            scrollToId="franchise-reviews-panel"
          />
        </div>
      </div>
    </>
  )
}
