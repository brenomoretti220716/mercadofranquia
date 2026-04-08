'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  BusinessModelInput,
  BusinessModelSchema,
} from '@/src/schemas/businessModels/BusinessModel'
import { useCreateBusinessModel } from '@/src/hooks/businessModels/useBusinessModelMutations'
import RoundedButton from '@/src/components/ui/RoundedButton'
import FormInput from '@/src/components/ui/FormInput'
import FormTextarea from '@/src/components/ui/FormTextarea'
import PhotoUploader from '@/src/components/ui/PhotoUploader'

interface BusinessModelRegisterProps {
  franchiseId: string
  token: string
  onSuccess?: () => void
}

export default function BusinessModelRegister({
  franchiseId,
  token,
  onSuccess,
}: BusinessModelRegisterProps) {
  const createMutation = useCreateBusinessModel(token)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    trigger,
  } = useForm<BusinessModelInput>({
    resolver: zodResolver(BusinessModelSchema),
  })

  const handlePhotoChange = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0]
      setValue('photo', file, { shouldValidate: true })
      setTimeout(() => trigger('photo'), 100)
    } else {
      setValue('photo', undefined as unknown as File, { shouldValidate: true })
      setTimeout(() => trigger('photo'), 100)
    }
  }

  async function handleCreate(data: BusinessModelInput) {
    createMutation.mutate(
      {
        franchiseId,
        name: data.name,
        description: data.description,
        photo: data.photo,
      },
      {
        onSuccess: () => {
          if (onSuccess) {
            onSuccess()
          }
        },
      },
    )
  }

  return (
    <form
      className="space-y-4 w-full"
      onSubmit={handleSubmit(handleCreate)}
      noValidate
    >
      <div className="flex flex-col">
        <label className="mb-1 font-medium text-foreground">
          Foto <span className="text-destructive text-sm">5MB</span>
        </label>
        <PhotoUploader
          onChange={handlePhotoChange}
          allowPdf={false}
          maxSize={5 * 1024 * 1024}
          module="business-models"
        />
        {errors.photo && (
          <div className="text-destructive text-sm mt-1">
            {errors.photo.message}
          </div>
        )}
      </div>

      <FormInput
        label="Nome"
        id="name"
        type="text"
        placeholder="Preencha o nome do modelo de negócio"
        error={errors.name?.message}
        register={register('name')}
        disabled={createMutation.isPending}
        paddingVariant="without-icon"
      />

      <FormTextarea
        label="Descrição"
        id="description"
        rows={4}
        placeholder="Escreva uma breve descrição do modelo de negócio"
        error={errors.description?.message}
        register={register('description')}
        disabled={createMutation.isPending}
        paddingVariant="standard"
        showCharacterCount={true}
        maxCharacterCount={2000}
      />

      <div className="grid w-full mt-6">
        <RoundedButton
          color="hsl(240 24% 12%)"
          hoverColor="hsl(10 79% 57%)"
          text={createMutation.isPending ? 'Criando...' : 'Criar Modelo'}
          textColor="white"
          disabled={createMutation.isPending}
        />
      </div>
    </form>
  )
}
