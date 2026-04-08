import Api from '@/src/api/Api'
import {
  Review,
  ReviewsList,
  ReviewsListSchema,
  UserReviewList,
  UserReviewListSchema,
} from '@/src/schemas/franchises/Reviews'

export async function fetchReviews(
  franchiseId: string,
  token?: string,
): Promise<Review[]> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(Api(`/reviews/franchise/${franchiseId}`), {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    if (response.status === 404) {
      return []
    }
    throw new Error(`Failed to fetch reviews: ${response.status}`)
  }

  const result = await response.json()

  // Temporary debug log to inspect latest reviews payload and franchise.slug
  if (typeof window !== 'undefined') {
    console.log('fetchLatestReviews raw result', result)
  }

  try {
    const validatedResult = ReviewsListSchema.parse(result)
    return validatedResult.data || []
  } catch {
    return result.data || []
  }
}

interface FetchFranchiseReviewsPaginatedParams {
  franchiseId: string
  page?: number
  limit?: number
  token?: string
}

export async function fetchFranchiseReviewsPaginated({
  franchiseId,
  page = 1,
  limit = 4,
  token,
}: FetchFranchiseReviewsPaginatedParams): Promise<ReviewsList> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const url = Api(
    `/reviews/franchise/${franchiseId}?page=${page}&limit=${limit}`,
  )

  const response = await fetch(url, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    if (response.status === 404) {
      return {
        data: [],
        total: 0,
        page,
        limit,
      }
    }
    throw new Error(`Failed to fetch reviews: ${response.status}`)
  }

  const result = await response.json()

  try {
    return ReviewsListSchema.parse(result)
  } catch {
    // Fallback para payloads parcialmente compatíveis
    return {
      data: result.data || [],
      total: result.total ?? result.data?.length ?? 0,
      page: result.page ?? page,
      limit: result.limit ?? limit,
    }
  }
}

export async function fetchLatestReviews(limit: number = 3): Promise<Review[]> {
  const url = Api(`/reviews?limit=${limit}&orderBy=createdAt&order=desc`)

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      return []
    }

    const errorBody = await response.text()
    const error = new Error(
      `Failed to fetch latest reviews: ${response.status} ${response.statusText}`,
    )
    ;(error as Error & { status?: number; body?: string }).status =
      response.status
    ;(error as Error & { status?: number; body?: string }).body = errorBody
    throw error
  }

  const result = await response.json()

  try {
    const validatedResult = ReviewsListSchema.parse(result)
    return validatedResult.data || []
  } catch {
    return result.data || []
  }
}

interface FetchUserReviewsParams {
  page?: number
  limit?: number
  sortBy?: 'review' | 'response'
  token: string
}

export async function fetchUserReviews({
  page = 1,
  limit = 10,
  sortBy = 'review',
  token,
}: FetchUserReviewsParams): Promise<UserReviewList> {
  const url = Api(
    `/reviews/user/my-reviews?page=${page}&limit=${limit}&sortBy=${sortBy}`,
  )

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()

    const error = new Error(
      `Failed to fetch user reviews: ${response.status} ${response.statusText}`,
    )
    ;(error as Error & { status?: number; body?: string }).status =
      response.status
    ;(error as Error & { status?: number; body?: string }).body = errorBody
    throw error
  }

  const result = await response.json()
  return UserReviewListSchema.parse(result)
}
