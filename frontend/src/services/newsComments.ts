import Api from '@/src/api/Api'
import {
  CreateNewsCommentData,
  NewsComment,
} from '@/src/schemas/news/NewsComment'
import { getClientAuthCookie } from '@/src/utils/clientCookie'

export async function fetchNewsComments(
  newsId: string,
): Promise<NewsComment[]> {
  const response = await fetch(Api(`/news/${newsId}/comments`), {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch news comments: ${response.status}`)
  }

  const data = await response.json()
  return data
}

export async function createNewsComment(
  newsId: string,
  data: CreateNewsCommentData,
): Promise<NewsComment> {
  const token = getClientAuthCookie()

  if (!token) {
    throw new Error('No authentication found')
  }

  const response = await fetch(Api(`/news/${newsId}/comments`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to create comment')
  }

  return response.json()
}

export async function deleteNewsComment(commentId: string): Promise<void> {
  const token = getClientAuthCookie()

  if (!token) {
    throw new Error('No authentication found')
  }

  const response = await fetch(Api(`/news/comments/${commentId}`), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to delete comment')
  }
}
