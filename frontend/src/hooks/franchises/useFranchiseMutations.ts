import {
  addGalleryImages,
  deleteGalleryImage,
  deleteVideo,
  updateFranchise,
  updateFranchiseLogo,
  type UpdateFranchiseData,
} from '@/src/services/franchises'
import { formatErrorMessage } from '@/src/utils/errorHandlers'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// ===== UPDATE FRANCHISE MUTATION =====
export function useUpdateFranchise() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data, id }: { data: UpdateFranchiseData; id: string }) =>
      updateFranchise(data, id),
    onSuccess: (data, variables) => {
      toast.success('Franquia atualizada com sucesso!')

      // Invalida múltiplas queries relacionadas
      queryClient.invalidateQueries({
        queryKey: ['franchise', variables.id],
      })
      queryClient.invalidateQueries({
        queryKey: ['franchises'],
      })
      queryClient.invalidateQueries({
        queryKey: ['franchisor-franchises'],
      })
      queryClient.invalidateQueries({
        queryKey: ['franchisor-franchises', variables.id],
      })

      // Força refetch imediato
      queryClient.refetchQueries({
        queryKey: ['franchise', variables.id],
      })
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar franquia:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Erro ao atualizar franquia. Tente novamente.',
        ),
      )
    },
  })
}

// ===== ADD GALLERY IMAGES MUTATION =====
export function useAddGalleryImages() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      franchiseId,
      files,
    }: {
      franchiseId: string
      files: File[]
    }) => addGalleryImages(franchiseId, files),
    onSuccess: (data, variables) => {
      toast.success('Imagens adicionadas com sucesso!')

      // Invalidate and refetch franchise queries
      queryClient.invalidateQueries({
        queryKey: ['franchise', variables.franchiseId],
      })
      queryClient.invalidateQueries({
        queryKey: ['franchises'],
      })
      queryClient.invalidateQueries({
        queryKey: ['franchisor-franchises'],
      })

      // Force immediate refetch
      queryClient.refetchQueries({
        queryKey: ['franchise', variables.franchiseId],
      })
    },
    onError: (error: Error) => {
      console.error('Erro ao adicionar imagens à galeria:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Erro ao adicionar imagens. Tente novamente.',
        ),
      )
    },
  })
}

// ===== DELETE GALLERY IMAGE MUTATION =====
export function useDeleteGalleryImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      franchiseId,
      imageUrl,
    }: {
      franchiseId: string
      imageUrl: string
    }) => deleteGalleryImage(franchiseId, imageUrl),
    onSuccess: (data, variables) => {
      toast.success('Imagem deletada com sucesso!')

      // Invalidate and refetch franchise queries
      queryClient.invalidateQueries({
        queryKey: ['franchise', variables.franchiseId],
      })
      queryClient.invalidateQueries({
        queryKey: ['franchises'],
      })
      queryClient.invalidateQueries({
        queryKey: ['franchisor-franchises'],
      })

      // Force immediate refetch
      queryClient.refetchQueries({
        queryKey: ['franchise', variables.franchiseId],
      })
    },
    onError: (error: Error) => {
      console.error('Erro ao deletar imagem da galeria:', error)
      toast.error(
        formatErrorMessage(error, 'Erro ao deletar imagem. Tente novamente.'),
      )
    },
  })
}

// ===== DELETE VIDEO MUTATION =====
export function useDeleteVideo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      franchiseId,
      videoUrl,
    }: {
      franchiseId: string
      videoUrl: string
    }) => deleteVideo(franchiseId, videoUrl),
    onSuccess: (data, variables) => {
      toast.success('Vídeo deletado com sucesso!')

      // Invalidate and refetch franchise queries
      queryClient.invalidateQueries({
        queryKey: ['franchise', variables.franchiseId],
      })
      queryClient.invalidateQueries({
        queryKey: ['franchises'],
      })
      queryClient.invalidateQueries({
        queryKey: ['franchisor-franchises'],
      })

      // Force immediate refetch
      queryClient.refetchQueries({
        queryKey: ['franchise', variables.franchiseId],
      })
    },
    onError: (error: Error) => {
      console.error('Erro ao deletar vídeo:', error)
      toast.error(
        formatErrorMessage(error, 'Erro ao deletar vídeo. Tente novamente.'),
      )
    },
  })
}

// ===== UPDATE FRANCHISE LOGO MUTATION =====
export function useUpdateFranchiseLogo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ franchiseId, file }: { franchiseId: string; file: File }) =>
      updateFranchiseLogo(franchiseId, file),
    onSuccess: (data, variables) => {
      toast.success('Logo atualizado com sucesso!')

      // Invalidate and refetch franchise queries
      queryClient.invalidateQueries({
        queryKey: ['franchise', variables.franchiseId],
      })
      queryClient.invalidateQueries({
        queryKey: ['franchises'],
      })
      queryClient.invalidateQueries({
        queryKey: ['franchisor-franchises'],
      })

      // Force immediate refetch
      queryClient.refetchQueries({
        queryKey: ['franchise', variables.franchiseId],
      })
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar logo da franquia:', error)
      toast.error(
        formatErrorMessage(error, 'Erro ao atualizar logo. Tente novamente.'),
      )
    },
  })
}
