/**
 * Utility functions for environment detection
 */

/**
 * Checks if the current environment is production
 * @returns true if NEXT_PUBLIC_ENVIRONMENT is set to "production"
 */
export function isProduction(): boolean {
  return process.env.NEXT_PUBLIC_ENVIRONMENT === 'production'
}

/**
 * Checks if the current environment is development
 * @returns true if NEXT_PUBLIC_ENVIRONMENT is NOT set to "production"
 */
export function isDevelopment(): boolean {
  return !isProduction()
}
