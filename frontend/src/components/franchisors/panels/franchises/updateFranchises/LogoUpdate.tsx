'use client'

import BaseModal from '@/src/components/ui/BaseModal'
import PhotoUploader from '@/src/components/ui/PhotoUploader'
import RoundedButton from '@/src/components/ui/RoundedButton'
import { useUpdateFranchiseLogo } from '@/src/hooks/franchises/useFranchiseMutations'
import { Franchise } from '@/src/schemas/franchises/Franchise'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'

const UpdateLogoSchema = z.object({
  logoUrl: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024, // 5MB
      'O arquivo deve ter no máximo 5MB',
    )
    .refine(
      (file) =>
        [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
        ].includes(file.type),
      'Apenas arquivos JPEG, PNG, GIF e WebP são permitidos',
    )
    .optional(),
})

type UpdateLogoSchema = z.infer<typeof UpdateLogoSchema>

interface LogoUpdateProps {
  franchise: Franchise
  isOpen: boolean
  onClose: () => void
}

export default function LogoUpdate({
  franchise,
  isOpen,
  onClose,
}: LogoUpdateProps) {
  const updateLogoMutation = useUpdateFranchiseLogo()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const {
    setValue,
    trigger,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm({
    resolver: zodResolver(UpdateLogoSchema),
  })

  const handlePicture = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0]

      if (file instanceof File && file.size > 0) {
        setSelectedFile(file)
        setValue('logoUrl', file, { shouldValidate: true })
        await trigger('logoUrl')
      }
    } else {
      setSelectedFile(null)
      setValue('logoUrl', undefined, { shouldValidate: true })
    }
  }

  const onSubmit = async (data: UpdateLogoSchema) => {
    if (data.logoUrl) {
      updateLogoMutation.mutate(
        {
          franchiseId: franchise.id,
          file: data.logoUrl,
        },
        {
          onSuccess: () => {
            setSelectedFile(null)
            reset()
            onClose()
          },
        },
      )
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    reset()
    onClose()
  }

  const getImageUrl = (logoUrl: string | null | undefined) => {
    if (!logoUrl) return null

    if (logoUrl.startsWith('http')) {
      return logoUrl
    }

    return `${process.env.NEXT_PUBLIC_API_URL}/uploads/franchises/${logoUrl}`
  }

  const imageUrl = getImageUrl(franchise.logoUrl)

  return (
    <BaseModal
      tittleText="Atualizar Logo da Franquia"
      subtittleText="Adicione uma nova logo para sua franquia"
      isOpen={isOpen}
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-foreground">
              Logo da Franquia
            </label>
            <span className="text-sm text-muted-foreground">
              Resolução recomendada: 500x500px
            </span>
          </div>

          <PhotoUploader
            onChange={handlePicture}
            defaultValue={imageUrl}
            module="franchise"
            allowPdf={false}
            key={`logo-${franchise?.id}-${imageUrl}`}
          />

          {errors.logoUrl && (
            <div className="text-destructive text-sm">
              {errors.logoUrl.message}
            </div>
          )}

          {selectedFile && (
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={updateLogoMutation.isPending}
              >
                Cancelar
              </button>
              <RoundedButton
                color="hsl(10 79% 57%)"
                textColor="white"
                text={
                  updateLogoMutation.isPending
                    ? 'Atualizando...'
                    : 'Atualizar Logo'
                }
                disabled={updateLogoMutation.isPending}
              />
            </div>
          )}
        </div>
      </form>
    </BaseModal>
  )
}
