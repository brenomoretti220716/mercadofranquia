/**
 * Generates a URL-friendly slug from a title and ID
 * @param title - The title to convert to a slug
 * @param id - The ID to append to the slug
 * @returns A URL-friendly slug in the format "slug-id"
 */
export function generateSlug(title: string, id: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim()
  return `${slug}-${id}`
}
