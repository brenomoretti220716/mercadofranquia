'use client'

import Api from '@/src/api/Api'
import FranchiseEditDetails from '@/src/components/shared/franchise-edit/FranchiseEditDetails'
import { Pagination } from '@/src/components/ui/Pagination'
import { Franchise } from '@/src/schemas/franchises/Franchise'
import { Review } from '@/src/schemas/franchises/Reviews'
import { getClientAuthCookie } from '@/src/utils/clientCookie'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import AdminCommentPanel from '../comments-controll/AdminCommentPanel'

const fetchFranchiseById = async (id: string): Promise<Franchise> => {
  const response = await fetch(Api(`/franchises/${id}`), {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`)
  }

  const result = await response.json()
  return result.data
}

// ✅ Função para buscar reviews separadamente (paginadas)
const fetchReviews = async (
  franchiseId: string,
  page: number,
  limit: number,
): Promise<{
  data: Review[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}> => {
  const response = await fetch(
    Api(`/reviews/admin/franchise/${franchiseId}?page=${page}&limit=${limit}`),
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getClientAuthCookie()}`,
      },
    },
  )

  if (!response.ok) {
    if (response.status === 404) {
      console.log('📝 No reviews found for franchise:', franchiseId)
      return {
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      }
    }
    throw new Error(`Response status: ${response.status}`)
  }

  const result = await response.json()
  return {
    data: (result.data || []) as Review[],
    pagination: result.pagination ?? {
      page,
      limit,
      total: result.total ?? result.data?.length ?? 0,
      totalPages:
        result.total && result.total > 0 ? Math.ceil(result.total / limit) : 0,
    },
  }
}

export default function AdminSelectedFranchise() {
  const params = useParams()
  const router = useRouter()
  const franchiseId = params.franquia as string
  const [page, setPage] = useState(1)
  const limit = 4
  const token = getClientAuthCookie() || ''

  // React Query para buscar franquia específica
  const { data: franchise } = useSuspenseQuery({
    queryKey: ['franchise', franchiseId],
    queryFn: () => fetchFranchiseById(franchiseId),
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  })

  // ✅ React Query para buscar reviews separadamente
  const { data: reviewsResult, refetch: refetchReviews } = useSuspenseQuery({
    queryKey: ['franchise-reviews', franchiseId, page, limit],
    queryFn: () => fetchReviews(franchiseId, page, limit),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  const reviews = reviewsResult?.data ?? []
  const total = reviewsResult?.pagination.total ?? reviews.length

  // Função para voltar à lista
  const handleBackToList = () => {
    router.push('/admin/franquias')
  }

  // ✅ Função para alternar status da review
  const handleToggleReviewStatus = async (
    reviewId: number,
    newStatus: boolean,
  ) => {
    try {
      // Refetch das reviews para atualizar a lista
      await refetchReviews()
      console.log(
        `Review ${reviewId} ${newStatus ? 'ativada' : 'desativada'} com sucesso!`,
      )
    } catch (error) {
      console.error('Erro ao atualizar lista de reviews:', error)
    }
  }

  // Loading/Erro: tratados via Suspense/ErrorBoundary na rota

  // No franchise found
  if (!franchise) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-gray-500 text-lg mb-4">
          Franquia não encontrada
        </div>
        <button
          onClick={handleBackToList}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Voltar à lista
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-4 m-10 mb-0">
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Voltar à lista
        </button>
      </div>

      <FranchiseEditDetails franchise={franchise} token={token} />

      <div id="admin-franchise-reviews-panel">
        <AdminCommentPanel
          reviews={reviews}
          franchiseName={franchise.name}
          onToggleReviewStatus={handleToggleReviewStatus}
        />
      </div>
      <div className="flex justify-center my-10">
        <Pagination
          page={page}
          total={total}
          limit={limit}
          onPageChange={setPage}
          scrollToId="admin-franchise-reviews-panel"
        />
      </div>
    </>
  )
}
