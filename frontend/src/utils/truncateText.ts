export const truncateText = (
  text: string,
  maxLength: number,
  fallback?: string,
): string => {
  if (!text) return fallback || 'N/A'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
