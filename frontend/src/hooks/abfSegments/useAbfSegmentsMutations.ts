import type {
  CreateAbfSegmentType,
  UpdateAbfSegmentType,
} from '@/src/schemas/abfSegments'
import {
  createAbfSegment,
  deleteAbfSegment,
  updateAbfSegment,
  UpdateAbfSegmentInput,
} from '@/src/services/abfSegments'
import { formatErrorMessage } from '@/src/utils/errorHandlers'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useCreateAbfSegment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateAbfSegmentType) => {
      return await createAbfSegment(data)
    },
    onSuccess: () => {
      toast.success('Segmento ABF cadastrado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['abfSegments'] })
    },
    onError: (error) => {
      toast.error(formatErrorMessage(error, 'Erro ao cadastrar segmento ABF'))
    },
  })
}

export function useUpdateAbfSegment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: UpdateAbfSegmentType
    }) => {
      const { ...rest } = data as unknown as {
        id?: string
      } & Record<string, unknown>
      return await updateAbfSegment(id, rest as UpdateAbfSegmentInput)
    },
    onSuccess: () => {
      toast.success('Segmento ABF atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['abfSegments'] })
    },
    onError: (error) => {
      toast.error(formatErrorMessage(error, 'Erro ao atualizar segmento ABF'))
    },
  })
}

export function useDeleteAbfSegment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteAbfSegment(id)
    },
    onSuccess: () => {
      toast.success('Segmento ABF deletado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['abfSegments'] })
    },
    onError: (error) => {
      toast.error(formatErrorMessage(error, 'Erro ao deletar segmento ABF'))
    },
  })
}
