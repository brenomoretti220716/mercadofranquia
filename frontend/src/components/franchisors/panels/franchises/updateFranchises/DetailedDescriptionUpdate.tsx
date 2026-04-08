'use client'

import Api from '@/src/api/Api'
import RoundedButton from '@/src/components/ui/RoundedButton'
import { formatErrorMessage, handleHttpError } from '@/src/utils/errorHandlers'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface DetailedDescriptionUpdateProps {
  franchiseId: string
  initialDescription?: string | null
  token: string
}

export default function DetailedDescriptionUpdate({
  franchiseId,
  initialDescription,
  token,
}: DetailedDescriptionUpdateProps) {
  const [description, setDescription] = useState(initialDescription || '')
  const queryClient = useQueryClient()

  // Sync description when initialDescription changes
  useEffect(() => {
    setDescription(initialDescription || '')
  }, [initialDescription])

  const updateMutation = useMutation({
    mutationFn: async (newDescription: string) => {
      const formData = new FormData()
      formData.append('detailedDescription', newDescription)

      const response = await fetch(
        Api(`/franchises/franchisor/${franchiseId}`),
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      )

      if (!response.ok) {
        const message = handleHttpError(
          response,
          'Não foi possível atualizar a descrição. Tente novamente.',
        )
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Descrição atualizada com sucesso!')

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['franchise', franchiseId],
      })
      queryClient.invalidateQueries({
        queryKey: ['franchises'],
      })
      queryClient.invalidateQueries({
        queryKey: ['franchisor-franchises'],
      })
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar descrição:', error)
      toast.error(
        formatErrorMessage(
          error,
          'Não foi possível atualizar a descrição. Tente novamente.',
        ),
      )
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(description)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col">
        <h2 className="font-bold text-2xl sm:text-3xl mb-4 text-foreground">
          Descrição
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex-1 min-w-0">
            <textarea
              id="detailedDescription"
              rows={6}
              placeholder="Responder"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={updateMutation.isPending}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none transition-colors"
            />
          </div>
          <div className="flex-shrink-0 w-full sm:w-auto">
            <RoundedButton
              text={updateMutation.isPending ? 'Enviando...' : 'Enviar'}
              color="hsl(10 79% 57%)"
              textColor="white"
              disabled={updateMutation.isPending}
            />
          </div>
        </div>
      </div>
    </form>
  )
}
