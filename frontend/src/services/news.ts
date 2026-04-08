import Api from '@/src/api/Api'
import { getClientAuthCookie } from '@/src/utils/clientCookie'
import { NewsSchema } from '../schemas/users/News'

export interface FetchNewsParams {
  page?: number
  limit?: number
  search?: string
  category?: string
}

export interface NewsResponse {
  items: NewsSchema[]
  total: number
  page: number
  limit: number
}

export async function fetchNews(
  params: FetchNewsParams,
): Promise<NewsResponse> {
  const { page = 1, limit = 10, search = '', category } = params

  const searchParams = new URLSearchParams()
  searchParams.set('page', String(page))
  searchParams.set('limit', String(limit))
  if (search) searchParams.set('search', search)
  if (category) searchParams.set('category', category)

  try {
    const response = await fetch(Api(`/news?${searchParams.toString()}`), {
      method: 'GET',
      // Add signal for timeout during build
      signal:
        typeof AbortSignal !== 'undefined'
          ? AbortSignal.timeout?.(5000)
          : undefined,
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.status}`)
    }

    const json = await response.json()

    return {
      items: json.data || [],
      total: json.total || 0,
      page: json.page || page,
      limit: json.limit || limit,
    }
  } catch (error) {
    // During build/SSR when API is unavailable, return empty data
    // This prevents build failures when API isn't accessible
    if (
      typeof window === 'undefined' ||
      (error as Error)?.name === 'AbortError' ||
      (error as Error)?.message?.includes('fetch failed')
    ) {
      return {
        items: [],
        total: 0,
        page,
        limit,
      }
    }
    throw error
  }
}

export async function fetchNewsById(id: string): Promise<NewsSchema> {
  const response = await fetch(Api(`/news/${id}`), {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch news: ${response.status}`)
  }

  const data = await response.json()
  return data
}

export async function fetchRelatedNews(
  category: string,
  currentId: string,
): Promise<NewsSchema[]> {
  const token = getClientAuthCookie()

  if (!token) {
    return []
  }

  const response = await fetch(Api('/news'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch related news: ${response.status}`)
  }

  const data = await response.json()

  // Filtrar notícias da mesma categoria, excluindo a atual
  const related = (data.data || [])
    .filter(
      (item: NewsSchema) =>
        item.isActive && item.category === category && item.id !== currentId,
    )
    .sort((a: NewsSchema, b: NewsSchema) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return dateB - dateA
    })
    .slice(0, 3) // Apenas 3 notícias relacionadas

  return related
}
