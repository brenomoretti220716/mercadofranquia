import Api from '@/src/api/Api'
import { getClientAuthCookie } from '@/src/utils/clientCookie'
import { handleHttpError } from '@/src/utils/errorHandlers'

export type AbfQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'

export interface AbfSegmentEntry {
  id: string
  year: number
  quarter: AbfQuarter | string
  segment: string
  acronym: string
  value: number
  createdAt?: string | Date
  updatedAt?: string | Date
}

export interface FetchAbfSegmentsParams {
  year?: number
  quarter?: AbfQuarter | string
}

export interface CreateAbfSegmentInput {
  year: number
  quarter: AbfQuarter | string
  segment: string
  acronym: string
  value: number
}

export interface UpdateAbfSegmentInput extends Partial<CreateAbfSegmentInput> {
  id: string
}

export async function fetchAbfSegments(
  params: FetchAbfSegmentsParams,
): Promise<AbfSegmentEntry[]> {
  const searchParams = new URLSearchParams()
  if (params.year !== undefined) searchParams.set('year', String(params.year))
  if (params.quarter !== undefined)
    searchParams.set('quarter', String(params.quarter))

  const qs = searchParams.toString()
  const response = await fetch(Api(`/abf-segments${qs ? `?${qs}` : ''}`), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ABF segments: ${response.status} ${response.statusText}`,
    )
  }

  const data = (await response.json()) as AbfSegmentEntry[]
  return data
}

export async function createAbfSegment(
  data: CreateAbfSegmentInput,
): Promise<AbfSegmentEntry> {
  const token = getClientAuthCookie()
  if (!token) throw new Error('No authentication found')

  const response = await fetch(Api('/abf-segments'), {
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
      'Erro ao cadastrar segmento ABF',
    )
    throw new Error(errorMessage)
  }

  return (await response.json()) as AbfSegmentEntry
}

export async function updateAbfSegment(
  id: string,
  data: UpdateAbfSegmentInput,
): Promise<AbfSegmentEntry> {
  const token = getClientAuthCookie()
  if (!token) throw new Error('No authentication found')

  const response = await fetch(Api(`/abf-segments/${id}`), {
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
      'Erro ao atualizar segmento ABF',
    )
    throw new Error(errorMessage)
  }

  return (await response.json()) as AbfSegmentEntry
}

export async function deleteAbfSegment(id: string): Promise<void> {
  const token = getClientAuthCookie()
  if (!token) throw new Error('No authentication found')

  const response = await fetch(Api(`/abf-segments/${id}`), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorMessage = handleHttpError(
      response,
      'Erro ao deletar segmento ABF',
    )
    throw new Error(errorMessage)
  }
}

export async function deleteAbfSegmentWithMessage(id: string): Promise<{
  message: string
}> {
  const token = getClientAuthCookie()
  if (!token) throw new Error('No authentication found')

  const response = await fetch(Api(`/abf-segments/${id}`), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorMessage = handleHttpError(
      response,
      'Erro ao deletar segmento ABF',
    )
    throw new Error(errorMessage)
  }

  return (await response.json()) as { message: string }
}
