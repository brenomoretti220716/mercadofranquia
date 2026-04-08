/**
 * Centralized error handling utilities for HTTP responses
 */

/**
 * Maps HTTP status codes to user-friendly error messages
 * @param response - The HTTP Response object
 * @param defaultMessage - Default message if status code doesn't match any case
 * @returns A user-friendly error message
 */
export const handleHttpError = (
  response: Response,
  defaultMessage: string,
): string => {
  switch (response.status) {
    case 400:
      return 'Dados inválidos. Verifique as informações e tente novamente.'
    case 401:
      return 'Você não tem permissão para realizar esta ação.'
    case 403:
      return 'Acesso negado. Verifique suas credenciais.'
    case 404:
      return 'Recurso não encontrado.'
    case 409:
      return 'Conflito: Este recurso já existe.'
    case 422:
      return 'Dados inválidos. Verifique as informações fornecidas.'
    case 429:
      return 'Muitas tentativas. Aguarde um momento e tente novamente.'
    case 500:
      return 'Erro interno do servidor. Tente novamente mais tarde.'
    case 502:
    case 503:
    case 504:
      return 'Serviço temporariamente indisponível. Tente novamente mais tarde.'
    default:
      return defaultMessage
  }
}

/**
 * Formats error messages for display to users
 * @param error - The error object
 * @param defaultMessage - Default message if error is not an Error instance
 * @returns A formatted error message
 */
const TECHNICAL_MESSAGE_PATTERNS = [
  'http error',
  'failed to fetch',
  'networkerror',
  'network error',
  'timeout',
  'unexpected token',
] as const

const isTechnicalMessage = (message: string) => {
  const normalized = message.trim().toLowerCase()

  if (!normalized) {
    return true
  }

  return TECHNICAL_MESSAGE_PATTERNS.some((pattern) =>
    normalized.includes(pattern),
  )
}

export const getUserFacingMessage = (
  error: unknown,
  defaultMessage: string,
): string => {
  if (!(error instanceof Error)) {
    return defaultMessage
  }

  if (isTechnicalMessage(error.message)) {
    return defaultMessage
  }

  return error.message
}

export const formatErrorMessage = (
  error: unknown,
  defaultMessage: string = 'Erro inesperado. Tente novamente.',
): string => {
  return getUserFacingMessage(error, defaultMessage)
}

/**
 * Custom error messages for specific HTTP status codes
 */
export const HTTP_ERROR_MESSAGES = {
  400: 'Dados inválidos. Verifique as informações e tente novamente.',
  401: 'Você não tem permissão para realizar esta ação.',
  403: 'Acesso negado. Verifique suas credenciais.',
  404: 'Recurso não encontrado.',
  409: 'Conflito: Este recurso já existe.',
  422: 'Dados inválidos. Verifique as informações fornecidas.',
  429: 'Muitas tentativas. Aguarde um momento e tente novamente.',
  500: 'Erro interno do servidor. Tente novamente mais tarde.',
  502: 'Serviço temporariamente indisponível. Tente novamente mais tarde.',
  503: 'Serviço temporariamente indisponível. Tente novamente mais tarde.',
  504: 'Serviço temporariamente indisponível. Tente novamente mais tarde.',
} as const

/**
 * Gets error message for a specific HTTP status code
 * @param status - HTTP status code
 * @param defaultMessage - Default message if status code is not found
 * @returns Error message
 */
export const getHttpErrorMessage = (
  status: number,
  defaultMessage: string,
): string => {
  return (
    HTTP_ERROR_MESSAGES[status as keyof typeof HTTP_ERROR_MESSAGES] ||
    defaultMessage
  )
}
