'use client'

import ModalRedirectLogin from '@/src/components/ui/ModalRedirectLogin'
import ModalIncompleteProfile from '@/src/components/ui/ModalIncompleteProfile'
import RoundedButton from '@/src/components/ui/RoundedButton'
import { useNewsComments } from '@/src/hooks/news/useNewsComments'
import { useAuth } from '@/src/hooks/users/useAuth'
import { useProfileCompletion } from '@/src/hooks/users/useProfileCompletion'
import { useState } from 'react'
import AddNewsComment from './AddNewsComment'
import NewsCommentsList from './NewsCommentsList'

interface NewsCommentsProps {
  newsId: string
}

export default function NewsComments({ newsId }: NewsCommentsProps) {
  const { isAuthenticated } = useAuth()
  const { data: profileCompletion } = useProfileCompletion(isAuthenticated)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isIncompleteProfileModalOpen, setIsIncompleteProfileModalOpen] =
    useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const { data: comments = [], error, refetch } = useNewsComments(newsId)

  const handleAddCommentClick = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true)
      return
    }

    // Check if profile is complete
    if (profileCompletion && !profileCompletion.isComplete) {
      setIsIncompleteProfileModalOpen(true)
      return
    }

    setShowAddForm(true)
  }

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false)
  }

  const handleCloseIncompleteProfileModal = () => {
    setIsIncompleteProfileModalOpen(false)
  }

  const handleCommentSuccess = () => {
    setShowAddForm(false)
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

      <div className="relative flex flex-col m-4 sm:m-5 md:m-10 rounded-2xl">
        <div className="flex flex-col w-full rounded-2xl p-5 sm:p-6 md:p-10 bg-[#FFFFFF]">
          <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-start md:items-center mb-6">
            <div className="flex flex-col">
              <h2 className="font-manrope font-extrabold text-xl sm:text-2xl">
                Comentários
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {comments.length}{' '}
                {comments.length === 1 ? 'comentário' : 'comentários'}
              </p>
            </div>

            {!showAddForm && (
              <RoundedButton
                text="Adicionar comentário"
                onClick={handleAddCommentClick}
                color="#E25E3E"
                textColor="white"
              />
            )}
          </div>

          {showAddForm && isAuthenticated && (
            <div className="mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Novo comentário</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  Cancelar
                </button>
              </div>
              <AddNewsComment
                newsId={newsId}
                onSuccess={handleCommentSuccess}
              />
            </div>
          )}

          <div className="flex flex-col">
            {error && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="text-red-500 text-center mb-4">
                  Erro ao carregar comentários: {error.message}
                </div>
                <button
                  onClick={() => refetch()}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {!error && <NewsCommentsList comments={comments} newsId={newsId} />}
          </div>
        </div>
      </div>
    </>
  )
}
