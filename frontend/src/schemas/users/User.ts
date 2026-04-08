import { FavoriteItem } from '@/src/services/franchises'
import { Franchise } from '../franchises/Franchise'
import { ReviewResponse } from '../franchises/Reviews'
import { FranchisorRequestStatus, Role } from './constants'

export type User = {
  id: string
  name: string
  email: string
  password: string
  phone: string
  cpf: string
  role: Role
  isActive: boolean
  createdAt: Date
  updatedAt: Date

  ownedFranchises: Franchise[]
  franchiseeOf: Franchise[]
  reviewResponses: ReviewResponse[]
  favorites: FavoriteItem[]
  franchisorProfile: FranchisorUser | null
  profile: UserProfile | null
  franchisorRequest: FranchisorRequest | FranchisorRequestData | null
  reviewedRequests: FranchisorRequest[]
}

type UserProfile = {
  id: string
  userId: string
  city: string
  interestSectors: string
  interestRegion: string
  investmentRange: string
  user: User
}

type FranchisorUser = {
  id: string
  streamName: string
  userId: string
  cnpj: string
  cnpjCardPath: string | null
  socialContractPath: string
  responsable: string
  responsableRole: string
  commercialEmail: string
  commercialPhone: string
  createdAt: Date
  updatedAt: Date
  user: User
}

export type FranchisorRequestData = {
  id: string
  status: FranchisorRequestStatus
  rejectionReason: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  cnpj: string
  streamName: string
  commercialEmail: string
  commercialPhone: string
  cnpjCardPath: string
  socialContractPath: string
  reviewer?: {
    id: string
    name: string
    email: string
  } | null
}

type FranchisorRequest = {
  id: string
  userId: string
  streamName: string
  cnpj: string
  cnpjCardPath: string
  socialContractPath: string
  responsable: string
  responsableRole: string
  commercialEmail: string
  commercialPhone: string
  status: FranchisorRequestStatus
  rejectionReason: string | null
  reviewedBy: string | null
  reviewedAt: Date | null
  createdAt: Date
  updatedAt: Date
  user: User
  reviewer: User | null
}
