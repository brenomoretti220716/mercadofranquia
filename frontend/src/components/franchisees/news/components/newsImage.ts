export function getNewsImageUrl(
  photoUrl: string | undefined,
  fallback: string = '/assets/news.jpg',
) {
  if (!photoUrl) {
    return fallback
  }

  if (photoUrl.startsWith('http')) {
    return photoUrl
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
  return `${baseUrl}/uploads/news/${photoUrl}`
}
