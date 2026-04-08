import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleHttpError, formatErrorMessage } from '@/src/utils/errorHandlers'

interface CreateBusinessModelInput {
  franchiseId: string
  name: string
  description: string
  photo: File
}

interface UpdateBusinessModelInput {
  name?: string
  description?: string
  photo?: File
}

async function createBusinessModel(
  data: CreateBusinessModelInput,
  token: string,
) {
  const formData = new FormData()
  formData.append('franchiseId', data.franchiseId)
  formData.append('name', data.name)
  formData.append('description', data.description)
  formData.append('photo', data.photo)

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/business-models`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  )

  if (!response.ok) {
    const message = handleHttpError(
      response,
      'Não foi possível criar o modelo de negócio. Tente novamente.',
    )
    throw new Error(message)
  }

  return response.json()
}

async function updateBusinessModel(
  id: string,
  data: UpdateBusinessModelInput,
  token: string,
) {
  const formData = new FormData()
  if (data.name) formData.append('name', data.name)
  if (data.description) formData.append('description', data.description)
  if (data.photo) formData.append('photo', data.photo)

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/business-models/${id}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  )

  if (!response.ok) {
    const message = handleHttpError(
      response,
      'Não foi possível atualizar o modelo de negócio. Tente novamente.',
    )
    throw new Error(message)
  }

  return response.json()
}

async function deleteBusinessModel(id: string, token: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/business-models/${id}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const message = handleHttpError(
      response,
      'Não foi possível excluir o modelo de negócio. Tente novamente.',
    )
    throw new Error(message)
  }

  return response.json()
}

export function useCreateBusinessModel(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBusinessModelInput) =>
      createBusinessModel(data, token),
    onSuccess: (_, variables) => {
      toast.success('Modelo de negócio criado com sucesso!')
      queryClient.invalidateQueries({
        queryKey: ['businessModels', variables.franchiseId],
      })
    },
    onError: (error: Error) => {
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível criar o modelo de negócio. Tente novamente.',
        ),
      )
    },
  })
}

export function useUpdateBusinessModel(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateBusinessModelInput
    }) => updateBusinessModel(id, data, token),
    onSuccess: (data) => {
      toast.success('Modelo de negócio atualizado com sucesso!')
      queryClient.invalidateQueries({
        queryKey: ['businessModels', data.franchiseId],
      })
      queryClient.invalidateQueries({
        queryKey: ['businessModel', data.id],
      })
    },
    onError: (error: Error) => {
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível atualizar o modelo de negócio. Tente novamente.',
        ),
      )
    },
  })
}

export function useDeleteBusinessModel(token: string, franchiseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteBusinessModel(id, token),
    onSuccess: () => {
      toast.success('Modelo de negócio excluído com sucesso!')
      queryClient.invalidateQueries({
        queryKey: ['businessModels', franchiseId],
      })
    },
    onError: (error: Error) => {
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível excluir o modelo de negócio. Tente novamente.',
        ),
      )
    },
  })
}
