import Api from '../api/Api'
import { LoginInput } from '../schemas/users/auth'
import { setClientAuthCookie } from '../utils/clientCookie'

export async function login(credentials: LoginInput) {
  try {
    const response = await fetch(Api('/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw new Error('Login failed')
    }

    const data = await response.json()

    // Store token in cookie
    if (data.token) {
      setClientAuthCookie(data.token)
    }

    return data
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}
