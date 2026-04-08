export const convertToEmbedUrl = (url: string): string => {
  try {
    if (url.includes('/embed/')) {
      return url
    }

    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
      /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]+)/,
      /(?:https?:\/\/)?m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`
      }
    }

    return url
  } catch (error) {
    console.error('Erro ao converter URL do YouTube:', error)
    return url
  }
}
