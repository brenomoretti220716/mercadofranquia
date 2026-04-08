import { User } from '../schemas/users/User'

/**
 * Calculates the profile completion percentage for a user
 * Checks: name, email, phone, cpf, role (not MEMBER), and profile fields
 */
export function calculateProfileCompletion(user: User | null): number {
  if (!user) return 0

  let completedFields = 0
  // name, email, phone, cpf, role, and 4 profile fields
  const totalFields = 9

  // Check basic info
  if (user.name) completedFields++
  if (user.email) completedFields++
  if (user.phone) completedFields++
  if (user.cpf) completedFields++

  // Check role (not MEMBER)
  if (user.role && user.role !== 'MEMBER') {
    completedFields++
  }

  // Check profile fields
  if (user.profile) {
    if (user.profile.city) completedFields++
    if (user.profile.interestSectors) completedFields++
    if (user.profile.interestRegion) completedFields++
    if (user.profile.investmentRange) completedFields++
  }

  return Math.round((completedFields / totalFields) * 100)
}

/**
 * Checks if a user's profile is complete
 */
export function isProfileComplete(user: User | null): boolean {
  if (!user) return false

  // Check basic info
  const hasBasicInfo = !!(user.name && user.email && user.phone && user.cpf)

  // Check role (not MEMBER)
  const hasValidRole = user.role && user.role !== 'MEMBER'

  // Check profile info
  const hasProfileInfo = !!(
    user.profile &&
    user.profile.city &&
    user.profile.interestSectors &&
    user.profile.interestRegion &&
    user.profile.investmentRange
  )

  return hasBasicInfo && hasValidRole && hasProfileInfo
}

/**
 * Returns a list of missing fields for profile completion
 */
export function getMissingFields(user: User | null): string[] {
  if (!user)
    return [
      'name',
      'email',
      'phone',
      'cpf',
      'role',
      'city',
      'interestSectors',
      'interestRegion',
      'investmentRange',
    ]

  const missingFields: string[] = []

  // Check basic info
  if (!user.name) missingFields.push('name')
  if (!user.email) missingFields.push('email')
  if (!user.phone) missingFields.push('phone')
  if (!user.cpf) missingFields.push('cpf')

  // Check role
  if (!user.role || user.role === 'MEMBER') {
    missingFields.push('role')
  }

  // Check profile fields
  if (!user.profile) {
    missingFields.push(
      'city',
      'interestSectors',
      'interestRegion',
      'investmentRange',
    )
  } else {
    if (!user.profile.city) missingFields.push('city')
    if (!user.profile.interestSectors) missingFields.push('interestSectors')
    if (!user.profile.interestRegion) missingFields.push('interestRegion')
    if (!user.profile.investmentRange) missingFields.push('investmentRange')
  }

  return missingFields
}

/**
 * Gets a human-readable field name for display
 */
export function getFieldDisplayName(field: string): string {
  const fieldNames: Record<string, string> = {
    name: 'Nome',
    email: 'E-mail',
    phone: 'Telefone',
    cpf: 'CPF',
    role: 'Tipo de perfil',
    city: 'Cidade',
    interestSectors: 'Setores de interesse',
    interestRegion: 'Região de interesse',
    investmentRange: 'Faixa de investimento',
  }

  return fieldNames[field] || field
}
