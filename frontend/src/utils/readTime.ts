/**
 * Calculate approximate reading time in minutes based on text content
 * @param content - Text content to calculate reading time for
 * @returns Estimated reading time in minutes (minimum 1)
 */
export function calculateReadTime(content: string | undefined | null): number {
  if (!content) return 1

  // Average reading speed: 200 words per minute (Portuguese)
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)

  return Math.max(1, minutes)
}

/**
 * Format read time as a string (e.g., "5 min")
 * @param minutes - Number of minutes
 * @returns Formatted string
 */
export function formatReadTime(minutes: number): string {
  return `${minutes} min`
}
