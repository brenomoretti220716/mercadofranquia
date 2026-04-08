/**
 * Validates franchise image URLs.
 * All URLs should already be full URLs, so this function just validates them.
 */
export function getFranchiseImageUrl(
  imageUrl: string | null | undefined,
): string | null {
  if (!imageUrl || !imageUrl.trim()) {
    return null
  }

  const trimmedUrl = imageUrl.trim()

  // Skip validation for obviously non-URL strings (single characters, very short strings)
  // These are likely data corruption issues, not malformed URLs
  if (trimmedUrl.length <= 2) {
    return null
  }

  // Validate URL format
  try {
    URL.parse(trimmedUrl)
    return trimmedUrl
  } catch {
    return null
  }
}

/**
 * Normalizes galleryUrls to always be an array.
 * Handles cases where the backend might send a string instead of an array.
 */
export function normalizeGalleryUrls(
  galleryUrls: string[] | string | null | undefined,
): string[] {
  if (!galleryUrls) {
    return []
  }

  // If it's already an array, return it
  if (Array.isArray(galleryUrls)) {
    return galleryUrls
  }

  // If it's a string, try to parse it as JSON first
  if (typeof galleryUrls === 'string') {
    const trimmed = galleryUrls.trim()

    // Try parsing as JSON array
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed
        }
      } catch {
        // Not valid JSON, continue to other checks
      }
    }

    // If it looks like a single URL (starts with http), return as single-item array
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return [trimmed]
    }

    // Otherwise, it's likely malformed data - return empty array
    console.warn(
      `galleryUrls is a string but not a valid URL or JSON array: ${trimmed.substring(0, 50)}`,
    )
    return []
  }

  return []
}

/**
 * Normalizes videoUrls to always be an array.
 * Handles cases where the backend might send a string instead of an array.
 */
export function normalizeVideoUrls(
  videoUrls: string[] | string | null | undefined,
): string[] {
  if (!videoUrls) {
    return []
  }

  // If it's already an array, return it
  if (Array.isArray(videoUrls)) {
    return videoUrls
  }

  // If it's a string, try to parse it as JSON first
  if (typeof videoUrls === 'string') {
    const trimmed = videoUrls.trim()

    // Try parsing as JSON array
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed
        }
      } catch {
        // Not valid JSON, continue to other checks
      }
    }

    // If it looks like a single URL (starts with http or youtube), return as single-item array
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.includes('youtube.com') ||
      trimmed.includes('youtu.be')
    ) {
      return [trimmed]
    }

    // Otherwise, it's likely malformed data - return empty array
    console.warn(
      `videoUrls is a string but not a valid URL or JSON array: ${trimmed.substring(0, 50)}`,
    )
    return []
  }

  return []
}

/**
 * Validates an array of franchise image URLs.
 * Filters out null/undefined values and invalid URLs.
 */
export function getFranchiseImageUrls(
  imageUrls: (string | null | undefined)[],
): string[] {
  return imageUrls
    .map((url) => getFranchiseImageUrl(url))
    .filter((url): url is string => url !== null)
}

/**
 * Checks if a franchise has any valid images (thumbnailUrl or galleryUrls).
 */
export function hasValidImages(
  thumbnailUrl: string | null | undefined,
  galleryUrls: string[] | string | null | undefined,
): boolean {
  const normalizedGallery = normalizeGalleryUrls(galleryUrls)
  const allImages = [
    ...(thumbnailUrl ? [thumbnailUrl] : []),
    ...normalizedGallery,
  ]
  const validImages = getFranchiseImageUrls(allImages)
  return validImages.length > 0
}

/**
 * Checks if a franchise has any valid videos.
 */
export function hasValidVideos(videoUrl: string | null | undefined): boolean {
  const normalizedVideos = normalizeVideoUrls(videoUrl)
  return (
    normalizedVideos.filter((video) => Boolean(video && video.trim())).length >
    0
  )
}
