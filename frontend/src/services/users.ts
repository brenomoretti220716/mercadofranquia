import Api from '@/src/api/Api'
import {
  ApproveFranchisorRequestDto,
  CreateFranchisorRequestDto,
  FranchisorRequest,
  RejectFranchisorRequestDto,
  UpdateFranchisorRequestDto,
} from '@/src/schemas/users/FranchisorRequest'
import { User } from '../schemas/users/User'

export type UserRole = 'admin' | 'franchisor' | 'members'

export interface FetchUsersParams {
  page?: number
  limit?: number
  search?: string
  role: UserRole
  token: string
}

export interface UsersResponse {
  data: User[]
  total: number
  page: number
  limit: number
}

const roleEndpoints: Record<UserRole, string> = {
  admin: '/admin',
  franchisor: '/admin/franchisors',
  members: '/admin/members',
}

export async function fetchUsersPaginated(
  params: FetchUsersParams,
): Promise<UsersResponse> {
  const { page = 1, limit = 10, search = '', role, token } = params

  const searchParams = new URLSearchParams()
  searchParams.set('page', String(page))
  searchParams.set('limit', String(limit))
  if (search) searchParams.set('search', search)

  const endpoint = roleEndpoints[role]
  const response = await fetch(Api(`${endpoint}?${searchParams.toString()}`), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${role} users: ${response.status}`)
  }

  return await response.json()
}

export interface GetMeResponse {
  id: string
  name: string
  email: string
  phone: string
  cpf: string
  role: string
  isActive: boolean
  profile?: {
    city: string
    interestSectors: string
    interestRegion: string
    investmentRange: string
  }
  franchiseeOf?: Array<{ id: string; name: string }>
}

export async function getMe(token: string): Promise<GetMeResponse> {
  const response = await fetch(Api('/users/me'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: 'Erro ao buscar informações do usuário' }))
    throw new Error(
      errorData.message || 'Erro ao buscar informações do usuário',
    )
  }

  return await response.json()
}

export interface UpdateBasicInfoParams {
  token: string
  data: UpdateUserBasicInfoDto
}

export async function updateBasicInfo(params: UpdateBasicInfoParams) {
  const { token, data } = params

  const response = await fetch(Api('/users/me'), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: 'Erro ao atualizar' }))
    throw new Error(
      errorData.message || 'Erro ao atualizar informações básicas',
    )
  }

  return await response.json()
}

export interface UpdateProfileParams {
  token: string
  data: {
    city?: string
    interestSectors?: string
    interestRegion?: string
    investmentRange?: string
    role?: 'FRANCHISEE' | 'CANDIDATE' | 'ENTHUSIAST' | 'FRANCHISOR'
    franchiseeOf?: string[]
  }
}

export interface UpdateProfileResponse {
  access_token?: string
  user?: User
  message?: string
}

export async function updateProfile(
  params: UpdateProfileParams,
): Promise<UpdateProfileResponse> {
  const { token, data } = params

  const response = await fetch(Api('/users/profile'), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: 'Erro ao atualizar perfil' }))
    throw new Error(errorData.message || 'Erro ao atualizar perfil')
  }

  return await response.json()
}

// Franchisor Request Services

export async function getMyFranchisorRequest(
  token: string,
): Promise<FranchisorRequest | null> {
  const response = await fetch(Api('/users/franchisor-request/my-request'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: 'Erro ao buscar solicitação' }))
    throw new Error(errorData.message || 'Erro ao buscar solicitação')
  }

  return await response.json()
}

export async function createFranchisorRequest(
  token: string,
  data: CreateFranchisorRequestDto,
): Promise<FranchisorRequest> {
  const formData = new FormData()
  formData.append('streamName', data.streamName)
  formData.append('cnpj', data.cnpj)
  formData.append('responsable', data.responsable)
  formData.append('responsableRole', data.responsableRole)
  formData.append('commercialEmail', data.commercialEmail)
  formData.append('commercialPhone', data.commercialPhone)
  formData.append('cnpjCard', data.cnpjCard)
  formData.append('socialContract', data.socialContract)

  const response = await fetch(Api('/users/franchisor-request'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: 'Erro ao criar solicitação' }))
    throw new Error(errorData.message || 'Erro ao criar solicitação')
  }

  return await response.json()
}

export async function updateFranchisorRequest(
  token: string,
  data: UpdateFranchisorRequestDto,
): Promise<FranchisorRequest> {
  const formData = new FormData()
  if (data.streamName) formData.append('streamName', data.streamName)
  if (data.cnpj) formData.append('cnpj', data.cnpj)
  if (data.responsable) formData.append('responsable', data.responsable)
  if (data.responsableRole)
    formData.append('responsableRole', data.responsableRole)
  if (data.commercialEmail)
    formData.append('commercialEmail', data.commercialEmail)
  if (data.commercialPhone)
    formData.append('commercialPhone', data.commercialPhone)
  if (data.cnpjCard) formData.append('cnpjCard', data.cnpjCard)
  if (data.socialContract)
    formData.append('socialContract', data.socialContract)

  const response = await fetch(Api('/users/franchisor-request'), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: 'Erro ao atualizar solicitação' }))
    throw new Error(errorData.message || 'Erro ao atualizar solicitação')
  }

  return await response.json()
}

export async function deleteFranchisorRequest(token: string): Promise<void> {
  const response = await fetch(Api('/users/franchisor-request'), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: 'Erro ao deletar solicitação' }))
    throw new Error(errorData.message || 'Erro ao deletar solicitação')
  }
}

// Admin Franchisor Request Services

export async function getAllFranchisorRequests(
  token: string,
): Promise<FranchisorRequest[]> {
  const response = await fetch(Api('/admin/franchisor-requests'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: 'Erro ao buscar solicitações' }))
    throw new Error(errorData.message || 'Erro ao buscar solicitações')
  }

  const data = await response.json()

  // Handle both array and object with data property
  return Array.isArray(data) ? data : data.data || []
}

export async function approveFranchisorRequest(
  token: string,
  requestId: string,
  data: ApproveFranchisorRequestDto,
): Promise<void> {
  const response = await fetch(
    Api(`/admin/franchisor-requests/${requestId}/approve`),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  )

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: 'Erro ao aprovar solicitação' }))
    throw new Error(errorData.message || 'Erro ao aprovar solicitação')
  }
}

export async function rejectFranchisorRequest(
  token: string,
  requestId: string,
  data: RejectFranchisorRequestDto,
): Promise<void> {
  const response = await fetch(
    Api(`/admin/franchisor-requests/${requestId}/reject`),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  )

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: 'Erro ao rejeitar solicitação' }))
    throw new Error(errorData.message || 'Erro ao rejeitar solicitação')
  }
}

// Admin User Creation
export interface CreateAdminDto {
  name: string
  email: string
  password: string
  phone: string
  cpf: string
}

export async function createAdmin(
  token: string,
  data: CreateAdminDto,
): Promise<User> {
  const response = await fetch(Api('/admin/admin'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: 'Erro ao criar administrador' }))
    throw new Error(errorData.message || 'Erro ao criar administrador')
  }

  return await response.json()
}

// Admin User Management Services

export async function getUserById(
  token: string,
  userId: string,
): Promise<User> {
  const response = await fetch(Api(`/admin/users/${userId}`), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: 'Erro ao buscar usuário' }))
    throw new Error(errorData.message || 'Erro ao buscar usuário')
  }

  return await response.json()
}

export interface UpdateUserBasicInfoDto {
  name?: string
  email?: string
  password?: string
  phone?: string
  cpf?: string
  isActive?: boolean
}

export async function updateUserBasicInfo(
  token: string,
  userId: string,
  data: UpdateUserBasicInfoDto,
): Promise<User> {
  const response = await fetch(Api(`/admin/users/${userId}`), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: 'Erro ao atualizar informações básicas' }))
    throw new Error(
      errorData.message || 'Erro ao atualizar informações básicas',
    )
  }

  return await response.json()
}

export interface UpdateUserProfileDto {
  city?: string
  interestSectors?: string
  interestRegion?: string
  investmentRange?: string
  role?: 'FRANCHISEE' | 'CANDIDATE' | 'ENTHUSIAST' | 'FRANCHISOR'
  franchiseeOf?: string[]
}

export async function updateUserProfile(
  token: string,
  userId: string,
  data: UpdateUserProfileDto,
): Promise<User> {
  const response = await fetch(Api(`/admin/users/${userId}/profile`), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: 'Erro ao atualizar perfil' }))
    throw new Error(errorData.message || 'Erro ao atualizar perfil')
  }

  return await response.json()
}

// Franchisor Update Service

export interface UpdateFranchisorDto {
  name?: string
  email?: string
  phone?: string
  password?: string
  ownedFranchises?: string[]
  isActive?: boolean
}

export async function updateFranchisor(
  token: string,
  userId: string,
  data: UpdateFranchisorDto,
): Promise<User> {
  const response = await fetch(Api(`/admin/franchisors/${userId}`), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: 'Erro ao atualizar franqueador' }))
    throw new Error(errorData.message || 'Erro ao atualizar franqueador')
  }

  return await response.json()
}

// Profile Completion Service

export interface ProfileCompletionResponse {
  isComplete: boolean
  completionPercentage: number
  missingFields: string[]
}

export async function getProfileCompletion(
  token: string,
): Promise<ProfileCompletionResponse> {
  const response = await fetch(Api('/users/me/profile-completion'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'Erro ao buscar status de completude do perfil',
    }))
    throw new Error(
      errorData.message || 'Erro ao buscar status de completude do perfil',
    )
  }

  return await response.json()
}
