import { BusinessModel } from '@/src/hooks/businessModels/useBusinessModels'
import type { Review } from './Reviews'

export type SponsorPlacement = 'HOME_DESTAQUES' | 'RANKING_CATEGORIA' | 'QUIZ'

export interface Franchise {
  id: string
  name: string
  slug: string

  // Investment Range
  minimumInvestment?: number | null
  maximumInvestment?: number | null

  headquarterState: string
  totalUnits: number
  unitsEvolution?: 'UP' | 'DOWN' | 'MAINTAIN' | null
  segment: string
  subsegment: string
  businessType: string
  brandFoundationYear: number
  franchiseStartYear: number
  abfSince: number

  // ROI Range (in months)
  minimumReturnOnInvestment?: number | null
  maximumReturnOnInvestment?: number | null

  // Single Numeric Fields
  franchiseFee?: number | null
  averageMonthlyRevenue?: number | null
  royalties?: number | null // percentage
  advertisingFee?: number | null // percentage
  setupCapital?: number | null
  workingCapital?: number | null
  storeArea?: number | null // m²

  videoUrl?: string | null
  thumbnailUrl?: string | null
  galleryUrls?: string[] | null
  logoUrl?: string | null
  detailedDescription?: string | null
  isActive: boolean
  isSponsored: boolean
  sponsorPlacements?: SponsorPlacement[] | null
  rankingPosition?: number | null
  createdAt: Date
  updatedAt: Date
  averageRating?: number | null
  businessModels?: BusinessModel[]
  // Relacionamentos
  contactId?: number | null
  contact?: ContactInfo | null
  ownerId?: string | null
  owner?: FranchiseOwner | null
  franchisees?: FranchiseeUser[]
  isReview: boolean
  reviews?: Review[]
}

export interface ContactInfo {
  id: number
  phone: string
  email: string
  website: string
}

export interface FranchiseOwner {
  id: string
  name: string
  email: string
  cpfCnpj?: string | null
  city?: string | null
  role: 'FRANCHISOR'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface FranchiseeUser {
  id: string
  name: string
  email: string
  city?: string | null
  role: 'FRANCHISEE' | 'CANDIDATE'
  motivation?:
    | 'ALREADY_FRANCHISEE_TRENDS'
    | 'NOT_FRANCHISEE_STUDYING'
    | 'FRANCHISEE_WANT_TO_SEE'
    | 'ENTHUSIAST_FIRST_HAND'
    | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Tipos auxiliares para diferentes contextos
export interface FranchiseListItem {
  id: string
  name: string
  slug?: string
  minimumInvestment?: number | null
  maximumInvestment?: number | null
  segment: string
  subsegment: string
  totalUnits: number
  unitsEvolution?: 'UP' | 'DOWN' | 'MAINTAIN' | null
  headquarterState: string
  logoUrl?: string | null
  minimumReturnOnInvestment?: number | null
  maximumReturnOnInvestment?: number | null
  franchiseFee?: number | null
  averageMonthlyRevenue?: number | null
  isActive: boolean
  isSponsored: boolean
  rankingPosition?: number | null
}

export interface FranchiseDetails extends Franchise {
  contact: ContactInfo
  owner?: FranchiseOwner
  reviews: Review[]
  // isActive já herdado de Franchise
}

export interface FranchiseFormData {
  name: string
  minimumInvestment?: number
  maximumInvestment?: number
  headquarterState: string
  units: number
  segment: string
  subsegment: string
  businessType: string
  foundedYear: number
  franchiseStartYear: number
  abfSince: number
  minimumReturnOnInvestment?: number
  maximumReturnOnInvestment?: number
  franchiseFee?: number
  averageMonthlyRevenue?: number
  videoUrl?: string
  photoUrl?: string
  isActive?: boolean
  contact?: {
    phone: string
    email: string
    website: string
  }
}

export interface CreateFranchiseData {
  name: string
  minimumInvestment?: number
  maximumInvestment?: number
  headquarterState: string
  units: number
  segment: string
  subsegment: string
  businessType: string
  foundedYear: number
  franchiseStartYear: number
  abfSince: number
  minimumReturnOnInvestment?: number
  maximumReturnOnInvestment?: number
  franchiseFee?: number
  averageMonthlyRevenue?: number
  videoUrl?: string
  photoUrl?: string
  isActive?: boolean
  contact?: {
    phone: string
    email: string
    website: string
  }
}

export interface UpdateFranchiseData {
  id: string
  name?: string
  minimumInvestment?: number | null
  maximumInvestment?: number | null
  headquarterState?: string
  units?: number
  segment?: string
  subsegment?: string
  businessType?: string
  foundedYear?: number
  franchiseStartYear?: number
  abfSince?: number
  minimumReturnOnInvestment?: number | null
  maximumReturnOnInvestment?: number | null
  franchiseFee?: number | null
  averageMonthlyRevenue?: number | null
  videoUrl?: string | null
  photoUrl?: string | null
  isActive?: boolean
  contact?: {
    phone?: string
    email?: string
    website?: string
  }
}

// ✅ Tipo para resposta da API de toggle de status
export interface ToggleFranchiseStatusResponse {
  success: boolean
  message: string
  data: {
    id: string
    name: string
    isActive: boolean
    updatedAt: Date
  }
}

// ✅ Tipo para filtros de franquias (admin)
export interface FranchiseFilters {
  isActive?: boolean
  segment?: string
  subsegment?: string
  headquarterState?: string
  minInvestment?: number
  maxInvestment?: number
  search?: string
}

// ✅ Tipo para estatísticas de franquias (admin)
export interface FranchiseStats {
  total: number
  active: number
  inactive: number
  bySegment: Record<string, number>
  byState: Record<string, number>
}
