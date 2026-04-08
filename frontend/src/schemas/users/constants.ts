/**
 * Centralized user-related enums and constants
 */

// ============================================================================
// ROLE ENUM
// ============================================================================

export enum Role {
  ADMIN = 'ADMIN',
  FRANCHISOR = 'FRANCHISOR',
  FRANCHISEE = 'FRANCHISEE',
  CANDIDATE = 'CANDIDATE',
  ENTHUSIAST = 'ENTHUSIAST',
  MEMBER = 'MEMBER',
}

// Display labels for roles
export const RoleEnum = {
  CANDIDATE: 'Candidato – buscando uma franquia para investir',
  FRANCHISEE: 'Franqueado – já possuo uma franquia em operação',
  FRANCHISOR: 'Franqueador – represento uma rede de franquias',
  ENTHUSIAST: 'Entusiasta/Investidor – acompanho o mercado de franquias',
} as const

export type RoleKey = keyof typeof RoleEnum

// ============================================================================
// FRANCHISOR REQUEST STATUS ENUM
// ============================================================================

export enum FranchisorRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
}

// ============================================================================
// DROPDOWN OPTIONS
// ============================================================================

export const InvestmentRangeOptions = [
  { value: '0-50000', label: 'Até R$ 50.000' },
  { value: '50000-100000', label: 'R$ 50.000 - R$ 100.000' },
  { value: '100000-200000', label: 'R$ 100.000 - R$ 200.000' },
  { value: '200000-500000', label: 'R$ 200.000 - R$ 500.000' },
  { value: '500000+', label: 'Acima de R$ 500.000' },
]

export const RegionOptions = [
  { value: 'Norte', label: 'Norte' },
  { value: 'Nordeste', label: 'Nordeste' },
  { value: 'Centro-Oeste', label: 'Centro-Oeste' },
  { value: 'Sudeste', label: 'Sudeste' },
  { value: 'Sul', label: 'Sul' },
]

export const SectorOptions = [
  { value: 'Alimentação', label: 'Alimentação' },
  { value: 'Moda', label: 'Moda' },
  { value: 'Saúde e Beleza', label: 'Saúde e Beleza' },
  { value: 'Educação', label: 'Educação' },
  { value: 'Tecnologia', label: 'Tecnologia' },
  { value: 'Serviços', label: 'Serviços' },
  { value: 'Varejo', label: 'Varejo' },
  { value: 'Hotelaria', label: 'Hotelaria' },
  { value: 'Outros', label: 'Outros' },
]
