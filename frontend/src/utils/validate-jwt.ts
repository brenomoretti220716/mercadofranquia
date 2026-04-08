import Api from '../api/Api'
import { getClientAuthCookie, removeClientAuthCookie } from './clientCookie'
import { ValidationResult } from '../schemas/auth/auth'

export async function validateJWT(): Promise<ValidationResult> {
  try {
    const token = getClientAuthCookie()

    if (!token) {
      return {
        isValid: false,
        token: null,
        error: 'No token found',
      }
    }

    const response = await fetch(Api('/auth/validate'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const responseData = await response.json()

      if (responseData.valid === true) {
        return {
          isValid: true,
          token,
          payload: responseData.payload,
        }
      } else {
        removeClientAuthCookie()
        return {
          isValid: false,
          token: null,
          error: 'Token validation failed',
        }
      }
    } else {
      removeClientAuthCookie()
      return {
        isValid: false,
        token: null,
        error: 'Invalid token',
      }
    }
  } catch (error) {
    removeClientAuthCookie()
    return {
      isValid: false,
      token: null,
      error: error instanceof Error ? error.message : 'Validation failed',
    }
  }
}

export function redirectToLogin() {
  window.location.href = '/login'
}
