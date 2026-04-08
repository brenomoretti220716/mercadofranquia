import Api from '@/src/api/Api'
import type { QuizFormValues } from '@/src/schemas/quiz/quiz'
import { getClientAuthCookie } from '@/src/utils/clientCookie'
import { handleHttpError } from '@/src/utils/errorHandlers'

export interface QuizSubmissionResponse {
  id: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface QuizFranchiseScoreBreakdown {
  segmentScore: number
  investmentScore: number
  paybackScore: number
  revenueScore: number
  networkScore: number
  zone: number
  confidence: number
  finalScore: number
}

export interface QuizFranchiseResult {
  id: string
  slug: string
  name: string
  segment: string | null
  subsegment: string | null
  minimumInvestment: number | null
  maximumInvestment: number | null
  averageMonthlyRevenue: number | null
  totalUnits: number | null
  logoUrl: string | null
  thumbnailUrl?: string | null
  score: QuizFranchiseScoreBreakdown
}

export interface QuizResultsPagination {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface QuizResultsBlock {
  label: 'mais_compativeis' | 'proximas_do_seu_perfil'
  zone: number
  franchises: QuizFranchiseResult[]
  pagination: QuizResultsPagination
}

export interface QuizResultsResponse {
  hasSubmission: boolean
  blocks: QuizResultsBlock[]
}

export interface QuizProfileAnswer {
  key: string
  label: string
  value: string
}

export interface QuizProfileSummaryResponse {
  answers: QuizProfileAnswer[]
}

function getAuthHeaders(): HeadersInit {
  const token = getClientAuthCookie()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export async function fetchMyQuiz(): Promise<QuizSubmissionResponse | null> {
  const response = await fetch(Api('/quiz'), {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    if (response.status === 401) {
      return null
    }
    throw new Error(handleHttpError(response, 'Erro ao carregar quiz'))
  }

  const data = await response.json()
  if (data === null) return null
  return data as QuizSubmissionResponse
}

export async function submitQuiz(
  answers: QuizFormValues,
): Promise<QuizSubmissionResponse> {
  const token = getClientAuthCookie()
  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const response = await fetch(Api('/quiz'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(answers),
  })

  if (!response.ok) {
    throw new Error(handleHttpError(response, 'Erro ao enviar quiz'))
  }

  return response.json() as Promise<QuizSubmissionResponse>
}

export async function updateQuiz(
  answers: QuizFormValues,
): Promise<QuizSubmissionResponse> {
  const token = getClientAuthCookie()
  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const response = await fetch(Api('/quiz'), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(answers),
  })

  if (!response.ok) {
    throw new Error(handleHttpError(response, 'Erro ao atualizar quiz'))
  }

  return response.json() as Promise<QuizSubmissionResponse>
}

export async function fetchQuizResults(
  page = 1,
  pageSize = 10,
): Promise<QuizResultsResponse> {
  const token = getClientAuthCookie()
  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const searchParams = new URLSearchParams()
  searchParams.set('page', String(page))
  searchParams.set('pageSize', String(pageSize))

  const response = await fetch(
    Api(`/quiz/results?${searchParams.toString()}`),
    {
      method: 'GET',
      headers: getAuthHeaders(),
    },
  )

  if (!response.ok) {
    if (response.status === 404) {
      return { hasSubmission: false, blocks: [] }
    }
    throw new Error(handleHttpError(response, 'Erro ao carregar resultados'))
  }

  return response.json() as Promise<QuizResultsResponse>
}

export async function fetchQuizProfile(): Promise<QuizProfileSummaryResponse> {
  const token = getClientAuthCookie()
  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const response = await fetch(Api('/quiz/profile'), {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    if (response.status === 404) {
      return { answers: [] }
    }
    throw new Error(
      handleHttpError(response, 'Erro ao carregar perfil do quiz'),
    )
  }

  return response.json() as Promise<QuizProfileSummaryResponse>
}
