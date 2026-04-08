'use client'

import ModalConfirmation from '@/src/components/ui/ModalConfirmation'
import { useDeleteNewsComment } from '@/src/hooks/news/useNewsComments'
import { isAdmin, useAuth } from '@/src/hooks/users/useAuth'
import { NewsComment } from '@/src/schemas/news/NewsComment'
import { formatDateToBrazilianLong } from '@/src/utils/dateFormatters'
import { useState } from 'react'

interface NewsCommentsListProps {
  comments: NewsComment[]
  newsId: string
}

export default function NewsCommentsList({
  comments,
  newsId,
}: NewsCommentsListProps) {
  const { payload } = useAuth()
  const { mutate: deleteComment, isPending: isDeleting } =
    useDeleteNewsComment()
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean
    commentId: string | null
  }>({
    isOpen: false,
    commentId: null,
  })

  const formatDate = formatDateToBrazilianLong

  const handleOpenDeleteModal = (commentId: string) => {
    setDeleteModalState({
      isOpen: true,
      commentId,
    })
  }

  const handleCloseDeleteModal = () => {
    setDeleteModalState({
      isOpen: false,
      commentId: null,
    })
  }

  const handleConfirmDelete = () => {
    if (!deleteModalState.commentId) return

    deleteComment(
      {
        commentId: deleteModalState.commentId,
        newsId,
      },
      {
        onSuccess: () => {
          handleCloseDeleteModal()
        },
      },
    )
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 sm:py-12 text-center">
        <div className="text-gray-500 text-base sm:text-lg mb-3 sm:mb-4 px-4">
          Ainda não há comentários para esta notícia
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-6 md:gap-8">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="p-4 sm:p-5 border-b border-gray-200 last:border-b-0"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-3">
              <div className="flex flex-col gap-1 flex-1">
                <h3 className="font-manrope font-bold text-base sm:text-lg">
                  {comment.author.name}
                </h3>
                <p className="font-manrope text-gray-600 text-sm">
                  {formatDate(comment.createdAt)}
                </p>
              </div>

              {isAdmin(payload) && (
                <button
                  onClick={() => handleOpenDeleteModal(comment.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors self-start sm:self-auto"
                  disabled={isDeleting}
                >
                  Deletar
                </button>
              )}
            </div>

            <div className="mb-2">
              <p className="text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      <ModalConfirmation
        isOpen={deleteModalState.isOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        text="Tem certeza que deseja deletar este comentário? Esta ação não pode ser desfeita."
        buttonText="Deletar Comentário"
        action="deletar"
      />
    </>
  )
}
