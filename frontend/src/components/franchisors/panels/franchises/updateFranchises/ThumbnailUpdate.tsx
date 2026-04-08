import PhotoUploader from '@/src/components/ui/PhotoUploader'
import RoundedButton from '@/src/components/ui/RoundedButton'
import { useUpdateFranchise } from '@/src/hooks/franchises/useFranchiseMutations'
import { Franchise } from '@/src/schemas/franchises/Franchise'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'

const UpdateThumbnailSchema = z.object({
  thumbnailUrl: z
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

type UpdateThumbnailSchema = z.infer<typeof UpdateThumbnailSchema>

interface FranchisorUpdateFranchiseProps {
  franchise: Franchise
}

export default function ThumbnailUpdate({
  franchise,
}: FranchisorUpdateFranchiseProps) {
  const updateFranchiseMutation = useUpdateFranchise()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const {
    setValue,
    trigger,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: zodResolver(UpdateThumbnailSchema),
  })

  const handlePicture = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0]

      if (file instanceof File && file.size > 0) {
        setSelectedFile(file)
        setValue('thumbnailUrl', file, { shouldValidate: true })
        await trigger('thumbnailUrl')
      }
    } else {
      setSelectedFile(null)
      setValue('thumbnailUrl', undefined, { shouldValidate: true })
    }
  }

  // ✅ Nova função para enviar quando clicar no botão
  const onSubmit = async (data: UpdateThumbnailSchema) => {
    if (data.thumbnailUrl) {
      updateFranchiseMutation.mutate({
        data: { thumbnailUrl: data.thumbnailUrl },
        id: franchise.id,
      })
    }
  }

  const getImageUrl = (thumnailUrl: string | null | undefined) => {
    if (!thumnailUrl) return null

    if (thumnailUrl.startsWith('http')) {
      return thumnailUrl
    }

    return `${process.env.NEXT_PUBLIC_API_URL}/uploads/franchises/${thumnailUrl}`
  }

  const imageUrl = getImageUrl(franchise.thumbnailUrl)

  return (
    <div className="flex flex-col">
      <div>
        <h2 className="font-bold text-2xl text-foreground">
          Thumbnail da Franquia
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex justify-between mb-5">
          <div className="flex flex-col">
            <label className="text-muted-foreground-600 text-sm mt-1">
              A primeira imagem da franquia a ser exibida
            </label>
            <span className="text-sm text-muted-foreground-500 mt-2">
              • Resolução recomendada: 1920x1080px
            </span>
          </div>

          {/* ✅ Botão só aparece quando há arquivo selecionado */}
          {selectedFile && (
            <div className="mt-3">
              <RoundedButton
                color="hsl(10 79% 57%)"
                textColor="white"
                text={
                  updateFranchiseMutation.isPending
                    ? 'Enviando...'
                    : 'Atualizar foto'
                }
                disabled={updateFranchiseMutation.isPending}
              />
            </div>
          )}
        </div>

        <PhotoUploader
          onChange={handlePicture}
          defaultValue={imageUrl}
          module="franchise"
          key={`photo-${franchise?.id}-${imageUrl}`}
        />

        {errors.thumbnailUrl && (
          <div className="text-red-500">{errors.thumbnailUrl.message}</div>
        )}
      </form>
    </div>
  )
}
