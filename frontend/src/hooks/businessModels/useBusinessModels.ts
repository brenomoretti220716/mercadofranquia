import { useQuery } from '@tanstack/react-query'

export interface BusinessModel {
  id: string
  name: string
  description: string
  photoUrl: string
  franchiseId: string
  createdAt: string
  updatedAt: string
}

async function fetchBusinessModelsByFranchise(
  franchiseId: string,
): Promise<BusinessModel[]> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/business-models/franchise/${franchiseId}`,
  )

  if (!response.ok) {
    throw new Error('Failed to fetch business models')
  }

  return response.json()
}

export function useBusinessModelsByFranchise(franchiseId: string) {
  return useQuery({
    queryKey: ['businessModels', franchiseId],
    queryFn: () => fetchBusinessModelsByFranchise(franchiseId),
    enabled: !!franchiseId,
  })
}

export async function fetchBusinessModelById(
  id: string,
): Promise<BusinessModel> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/business-models/${id}`,
  )

  if (!response.ok) {
    throw new Error('Failed to fetch business model')
  }

  return response.json()
}

export function useBusinessModelById(id: string) {
  return useQuery({
    queryKey: ['businessModel', id],
    queryFn: () => fetchBusinessModelById(id),
    enabled: !!id,
  })
}
