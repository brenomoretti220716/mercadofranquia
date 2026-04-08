/**
 * Utility functions for formatting dates in Brazilian format
 */

/**
 * Formats a date to Brazilian locale (dd/mm/yyyy)
 * @param dateString - Date as string, Date object, or undefined
 * @returns Formatted date string or empty string if invalid
 */
export function formatDateToBrazilian(
  dateString: string | Date | undefined,
): string {
  if (!dateString) return ''

  const date =
    typeof dateString === 'string' ? new Date(dateString) : dateString

  if (isNaN(date.getTime())) return ''

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Formats a date to Brazilian locale with long month name (dd de mês de yyyy)
 * @param dateString - Date as string, Date object, or undefined
 * @returns Formatted date string or empty string if invalid
 */
export function formatDateToBrazilianLong(
  dateString: string | Date | undefined,
): string {
  if (!dateString) return ''

  const date =
    typeof dateString === 'string' ? new Date(dateString) : dateString

  if (isNaN(date.getTime())) return ''

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Formats a date and time to Brazilian locale (dd/mm/yyyy HH:mm)
 * @param dateString - Date as string, Date object, or undefined
 * @returns Formatted date and time string or empty string if invalid
 */
export function formatDateTimeToBrazilian(
  dateString: string | Date | undefined,
): string {
  if (!dateString) return ''

  const date =
    typeof dateString === 'string' ? new Date(dateString) : dateString

  if (isNaN(date.getTime())) return ''

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formats a number to Brazilian locale (1.234,56)
 * @param value - Number to format
 * @returns Formatted number string
 */
export function formatNumberToBrazilian(value: number | undefined): string {
  if (value === undefined || value === null) return 'Não informado'

  return value.toLocaleString('pt-BR')
}
