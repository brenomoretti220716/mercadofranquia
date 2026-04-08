export interface Payload {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  iat: number
  exp: number
}
export interface ValidationResult {
  isValid: boolean
  token: string | null
  payload?: Payload
  error?: string
}
