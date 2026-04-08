import Api from '@/src/api/Api'
import type {
  Franchise,
  SponsorPlacement,
} from '@/src/schemas/franchises/Franchise'
import type {
  RankingBigNumber,
  RankingBigNumberInput,
} from '@/src/schemas/ranking/RankingBigNumber'
import type { FranchiseEditFormInput } from '@/src/schemas/franchises/FranchiseEdit'
import { getClientAuthCookie } from '@/src/utils/clientCookie'
import { handleHttpError } from '@/src/utils/errorHandlers'
import { stripNonDigits } from '@/src/utils/formaters'

export interface FetchFranchisesParams {
  page?: number
  limit?: number
  search?: string
  // Sorting (API format: 'asc' | 'desc')
  nameSort?: 'asc' | 'desc' | null
  ratingSort?: 'asc' | 'desc' | null
  unitsSort?: 'asc' | 'desc' | null
  investmentSort?: 'asc' | 'desc' | null
  roiSort?: 'asc' | 'desc' | null
  franchiseFeeSort?: 'asc' | 'desc' | null
  revenueSort?: 'asc' | 'desc' | null
  // Value range filters (as strings, will be converted to numbers)
  minInvestment?: string
  maxInvestment?: string
  minROI?: string
  maxROI?: string
  minFranchiseFee?: string
  maxFranchiseFee?: string
  minRevenue?: string
  maxRevenue?: string
  minUnits?: string
  maxUnits?: string
  rating?: number | null
  minRating?: number | null
  maxRating?: number | null
  // Segment filter (case-insensitive partial match)
  segment?: string
  // Subsegment filters (case-insensitive partial match)
  subsegment?: string
  excludeSubsegment?: string
  // Sponsored status filter
  isSponsored?: boolean
}

export interface FranchisesResponse {
  data: Franchise[]
  total: number
  page: number
  lastPage: number
  /** Present when using admin endpoint; used for sponsored limit UX */
  totalSponsored?: number
}

export async function fetchFranchises(): Promise<Franchise[]> {
  const response = await fetch(Api('/franchises'), {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch franchises: ${response.status}`)
  }

  const result = await response.json()
  return result.data || []
}

export async function fetchFranchiseOptions() {
  return fetchFranchiseOptionsWithParams()
}

export async function fetchFranchiseOptionsWithParams(options?: {
  availableOnly?: boolean
  userId?: string
}) {
  const searchParams = new URLSearchParams()
  if (options?.availableOnly) searchParams.set('availableOnly', 'true')
  if (options?.userId) searchParams.set('userId', options.userId)

  const endpoint = searchParams.toString()
    ? `/franchises/options?${searchParams.toString()}`
    : '/franchises/options'

  const response = await fetch(Api(endpoint), {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch options: ${response.status}`)
  }

  const result = await response.json()

  return (
    result?.map((item: { id: string; name?: string }) => ({
      value: item.id,
      label: item.name || 'Franquia sem nome',
    })) || []
  )
}

export async function fetchPaginatedFranchises(
  params: FetchFranchisesParams,
  token?: string,
): Promise<FranchisesResponse> {
  const searchParams = new URLSearchParams()

  searchParams.set('page', String(params.page || 1))
  searchParams.set('limit', String(params.limit || 10))

  if (params.search) searchParams.set('search', params.search)

  // Add sorting parameters (API format: 'asc' | 'desc')
  if (params.nameSort) searchParams.set('nameSort', params.nameSort)
  if (params.ratingSort) searchParams.set('ratingSort', params.ratingSort)
  if (params.unitsSort) searchParams.set('unitsSort', params.unitsSort)
  if (params.investmentSort)
    searchParams.set('investmentSort', params.investmentSort)
  if (params.roiSort) searchParams.set('roiSort', params.roiSort)
  if (params.franchiseFeeSort)
    searchParams.set('franchiseFeeSort', params.franchiseFeeSort)
  if (params.revenueSort) searchParams.set('revenueSort', params.revenueSort)

  // Add range filters (convert strings to numbers)
  if (params.minInvestment)
    searchParams.set('minInvestment', params.minInvestment)
  if (params.maxInvestment)
    searchParams.set('maxInvestment', params.maxInvestment)
  if (params.minROI) searchParams.set('minROI', params.minROI)
  if (params.maxROI) searchParams.set('maxROI', params.maxROI)
  if (params.minFranchiseFee)
    searchParams.set('minFranchiseFee', params.minFranchiseFee)
  if (params.maxFranchiseFee)
    searchParams.set('maxFranchiseFee', params.maxFranchiseFee)
  if (params.minRevenue) searchParams.set('minRevenue', params.minRevenue)
  if (params.maxRevenue) searchParams.set('maxRevenue', params.maxRevenue)
  if (params.minUnits) searchParams.set('minUnits', params.minUnits)
  if (params.maxUnits) searchParams.set('maxUnits', params.maxUnits)
  if (params.rating !== null && params.rating !== undefined)
    searchParams.set('rating', String(params.rating))
  if (params.minRating !== null && params.minRating !== undefined)
    searchParams.set('minRating', String(params.minRating))
  if (params.maxRating !== null && params.maxRating !== undefined)
    searchParams.set('maxRating', String(params.maxRating))
  if (params.segment) searchParams.set('segment', params.segment)
  if (params.subsegment) searchParams.set('subsegment', params.subsegment)
  if (params.excludeSubsegment)
    searchParams.set('excludeSubsegment', params.excludeSubsegment)
  if (params.isSponsored !== undefined)
    searchParams.set('isSponsored', String(params.isSponsored))

  const endpoint = token
    ? `/franchises/admin/all?${searchParams}`
    : `/franchises?${searchParams}`

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(Api(endpoint), {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(
        `Failed to fetch paginated franchises: ${response.status}`,
      )
    }

    const result = await response.json()

    return {
      data: result.data || [],
      total: result.total || 0,
      page: result.page || 1,
      lastPage: result.lastPage || 1,
      ...(typeof result.totalSponsored === 'number' && {
        totalSponsored: result.totalSponsored,
      }),
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
        data: [],
        total: 0,
        page: params.page || 1,
        lastPage: 1,
      }
    }
    throw error
  }
}

export async function fetchFranchiseById(
  id: string,
  token?: string,
): Promise<Franchise> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(Api(`/franchises/${id}`), {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch franchise ${id}: ${response.status}`)
  }

  const result = await response.json()
  return result.data
}

export async function fetchFranchisorFranchises(
  franchisorId: string,
  token: string,
): Promise<Franchise[]> {
  const response = await fetch(Api(`/franchises/franchisor/${franchisorId}`), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch franchisor franchises: ${response.status}`)
  }

  const result = await response.json()
  return result.data || []
}

export interface FetchFavoritesParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: 'createdAt' | 'name'
  order?: 'asc' | 'desc'
}

export interface FavoriteItem {
  id: string
  userId: string
  franchiseId: string
  createdAt: string
  franchise: Franchise
}

export async function fetchPaginatedFavorites(
  params: FetchFavoritesParams,
  token: string,
): Promise<FranchisesResponse> {
  const searchParams = new URLSearchParams()

  searchParams.set('page', String(params.page || 1))
  searchParams.set('limit', String(params.limit || 20))

  if (params.search) searchParams.set('search', params.search)
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.order) searchParams.set('order', params.order)

  const response = await fetch(Api(`/favorites?${searchParams}`), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch favorites: ${response.status}`)
  }

  const result = await response.json()

  // Extract franchise data from the nested structure
  const franchises =
    result.data?.map((item: FavoriteItem) => item.franchise) || []

  return {
    data: franchises,
    total: result.meta?.total || 0,
    page: result.meta?.page || 1,
    lastPage: result.meta?.totalPages || 1,
  }
}

// ===== UPDATE FRANCHISE =====
export interface UpdateFranchiseData extends Partial<FranchiseEditFormInput> {
  thumbnailUrl?: File
  videoUrl?: string
}

export async function updateFranchise(
  data: UpdateFranchiseData,
  id: string,
): Promise<Franchise> {
  const token = getClientAuthCookie()

  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const formData = new FormData()
  let hasFields = false

  // Helper function to check if a value should be included
  // Note: We now allow empty strings because they might represent intentional field clearing
  const shouldAppend = (value: unknown): boolean => {
    // Only exclude undefined and null, but allow empty strings
    return value !== undefined && value !== null
  }

  // File uploads
  if (data.thumbnailUrl instanceof File && data.thumbnailUrl.size > 0) {
    formData.append('thumbnailUrl', data.thumbnailUrl)
    hasFields = true
  }

  // Basic fields - only append non-empty values
  if (shouldAppend(data.name)) {
    formData.append('name', data.name as string)
    hasFields = true
  }
  if (shouldAppend(data.minimumInvestment)) {
    formData.append('minimumInvestment', String(data.minimumInvestment))
    hasFields = true
  }
  if (shouldAppend(data.maximumInvestment)) {
    formData.append('maximumInvestment', String(data.maximumInvestment))
    hasFields = true
  }
  if (shouldAppend(data.minimumReturnOnInvestment)) {
    formData.append(
      'minimumReturnOnInvestment',
      String(data.minimumReturnOnInvestment),
    )
    hasFields = true
  }
  if (shouldAppend(data.maximumReturnOnInvestment)) {
    formData.append(
      'maximumReturnOnInvestment',
      String(data.maximumReturnOnInvestment),
    )
    hasFields = true
  }
  if (shouldAppend(data.headquarterState)) {
    formData.append('headquarterState', data.headquarterState as string)
    hasFields = true
  }
  if (data.totalUnits !== undefined && data.totalUnits !== null) {
    formData.append('totalUnits', String(data.totalUnits))
    hasFields = true
  }
  if (shouldAppend(data.segment)) {
    formData.append('segment', data.segment as string)
    hasFields = true
  }
  if (shouldAppend(data.subsegment)) {
    formData.append('subsegment', data.subsegment as string)
    hasFields = true
  }
  if (shouldAppend(data.businessType)) {
    formData.append('businessType', data.businessType as string)
    hasFields = true
  }
  if (
    data.brandFoundationYear !== undefined &&
    data.brandFoundationYear !== null
  ) {
    formData.append('brandFoundationYear', String(data.brandFoundationYear))
    hasFields = true
  }
  if (
    data.franchiseStartYear !== undefined &&
    data.franchiseStartYear !== null
  ) {
    formData.append('franchiseStartYear', String(data.franchiseStartYear))
    hasFields = true
  }
  if (data.abfSince !== undefined && data.abfSince !== null) {
    formData.append('abfSince', String(data.abfSince))
    hasFields = true
  }
  if (shouldAppend(data.videoUrl)) {
    formData.append('videoUrl', data.videoUrl as string)
    hasFields = true
  }

  // Contact fields - strip formatting from phone
  if (shouldAppend(data.phone)) {
    const cleanPhone = stripNonDigits(data.phone as string)
    if (cleanPhone) {
      formData.append('phone', cleanPhone)
      hasFields = true
    }
  }
  if (shouldAppend(data.email)) {
    formData.append('email', data.email as string)
    hasFields = true
  }
  if (shouldAppend(data.website)) {
    formData.append('website', data.website as string)
    hasFields = true
  }

  // Validate that at least one field is being updated
  if (!hasFields) {
    throw new Error('Nenhum dado fornecido para atualização')
  }

  const response = await fetch(Api(`/franchises/franchisor/${id}`), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    // Handle validation errors (422) with detailed messages
    if (response.status === 422) {
      const errorData = await response.json().catch(() => ({}))
      if (errorData.errors && Array.isArray(errorData.errors)) {
        const validationErrors = errorData.errors
          .map(
            (e: { path: string; message: string }) => `${e.path}: ${e.message}`,
          )
          .join(', ')
        throw new Error(`Erro de validação: ${validationErrors}`)
      }
    }

    const errorMessage = handleHttpError(response, 'Erro ao atualizar franquia')
    throw new Error(errorMessage)
  }

  const result = await response.json()
  return result
}

export async function updateSponsorPlacements(
  franchiseId: string,
  placements: SponsorPlacement[],
): Promise<Franchise> {
  const token = getClientAuthCookie()

  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const response = await fetch(
    Api(`/franchises/${franchiseId}/sponsor-placements`),
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ placements }),
    },
  )

  if (!response.ok) {
    const errorMessage = handleHttpError(
      response,
      'Erro ao atualizar posicionamento de patrocínio',
    )
    throw new Error(errorMessage)
  }

  const result = await response.json()
  return result.data
}

export async function fetchRankingBigNumbers(
  year?: number,
): Promise<RankingBigNumber[]> {
  const query = year ? `?year=${year}` : ''
  const response = await fetch(Api(`/ranking-big-numbers${query}`), {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ranking big numbers: ${response.status}`)
  }

  return await response.json()
}

export async function fetchRankingBigNumbersYears(): Promise<number[]> {
  const response = await fetch(Api('/ranking-big-numbers/years'), {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ranking big numbers years: ${response.status}`,
    )
  }

  return await response.json()
}

export async function fetchAdminRankingBigNumbers(
  year?: number,
): Promise<RankingBigNumber[]> {
  const token = getClientAuthCookie()
  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const query = year ? `?year=${year}` : ''
  const response = await fetch(Api(`/ranking-big-numbers/admin${query}`), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch admin ranking big numbers: ${response.status}`,
    )
  }

  return await response.json()
}

export async function createRankingBigNumber(
  data: RankingBigNumberInput,
): Promise<RankingBigNumber> {
  const token = getClientAuthCookie()
  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const response = await fetch(Api('/ranking-big-numbers/admin'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorMessage = handleHttpError(
      response,
      'Erro ao criar card de big number',
    )
    throw new Error(errorMessage)
  }

  return await response.json()
}

export async function bulkCreateRankingBigNumbers(data: {
  year: number
  cards: Array<{
    position: number
    name: string
    growthPercentage: number
  }>
}): Promise<RankingBigNumber[]> {
  const token = getClientAuthCookie()
  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const response = await fetch(Api('/ranking-big-numbers/admin/bulk'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorMessage = handleHttpError(
      response,
      'Erro ao criar os 4 cards do ano',
    )
    throw new Error(errorMessage)
  }

  return await response.json()
}

export async function setRankingBigNumbersYearVisibility(data: {
  year: number
  isHidden: boolean
}): Promise<{ message: string; updatedCount: number }> {
  const token = getClientAuthCookie()
  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const response = await fetch(
    Api('/ranking-big-numbers/admin/year/visibility'),
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  )

  if (!response.ok) {
    const errorMessage = handleHttpError(
      response,
      'Erro ao atualizar visibilidade do ano',
    )
    throw new Error(errorMessage)
  }

  return await response.json()
}

export async function updateRankingBigNumber(
  id: string,
  data: Partial<RankingBigNumberInput>,
): Promise<RankingBigNumber> {
  const token = getClientAuthCookie()
  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const response = await fetch(Api(`/ranking-big-numbers/admin/${id}`), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorMessage = handleHttpError(
      response,
      'Erro ao atualizar card de big number',
    )
    throw new Error(errorMessage)
  }

  return await response.json()
}

export async function reorderRankingBigNumbers(data: {
  year?: number
  cards: Array<{ id: string; position: number }>
}): Promise<RankingBigNumber[]> {
  const token = getClientAuthCookie()
  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const response = await fetch(Api('/ranking-big-numbers/admin/reorder'), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorMessage = handleHttpError(response, 'Erro ao reordenar cards')
    throw new Error(errorMessage)
  }

  return await response.json()
}

// ===== ADD GALLERY IMAGES =====
export async function addGalleryImages(
  franchiseId: string,
  files: File[],
): Promise<Franchise> {
  const token = getClientAuthCookie()

  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const formData = new FormData()

  // Add all files with the same field name 'galleryImages'
  files.forEach((file) => {
    formData.append('galleryImages', file)
  })

  const response = await fetch(Api(`/franchises/${franchiseId}/gallery`), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorMessage = handleHttpError(
      response,
      'Erro ao adicionar imagens à galeria',
    )
    throw new Error(errorMessage)
  }

  const result = await response.json()
  return result.data
}

// ===== DELETE GALLERY IMAGE =====
export async function deleteGalleryImage(
  franchiseId: string,
  imageUrl: string,
): Promise<Franchise> {
  const token = getClientAuthCookie()

  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const response = await fetch(Api(`/franchises/${franchiseId}/gallery`), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ imageUrl }),
  })

  if (!response.ok) {
    const errorMessage = handleHttpError(
      response,
      'Erro ao deletar imagem da galeria',
    )
    throw new Error(errorMessage)
  }

  const result = await response.json()
  return result.data
}

// ===== DELETE VIDEO =====
export async function deleteVideo(
  franchiseId: string,
  videoUrl: string,
): Promise<Franchise> {
  const token = getClientAuthCookie()

  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const response = await fetch(Api(`/franchises/${franchiseId}/video`), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ videoUrl }),
  })

  if (!response.ok) {
    const errorMessage = handleHttpError(response, 'Erro ao deletar vídeo')
    throw new Error(errorMessage)
  }

  const result = await response.json()
  return result.data
}

// ===== UPDATE FRANCHISE LOGO =====
export async function updateFranchiseLogo(
  franchiseId: string,
  file: File,
): Promise<Franchise> {
  const token = getClientAuthCookie()

  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const formData = new FormData()
  formData.append('logoUrl', file)

  const response = await fetch(Api(`/franchises/${franchiseId}/logo`), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorMessage = handleHttpError(
      response,
      'Erro ao atualizar logo da franquia',
    )
    throw new Error(errorMessage)
  }

  const result = await response.json()
  return result.data
}
