import PhotoUploader from '@/src/components/ui/PhotoUploader'
import RoundedButton from '@/src/components/ui/RoundedButton'
import FormInput from '@/src/components/ui/FormInput'
import FormTextarea from '@/src/components/ui/FormTextarea'
import { useCreateNews } from '@/src/hooks/news/useNewsMutations'
import { CreateNewsSchema } from '@/src/schemas/users/News'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import CategoryInput from './CategoryInput'

interface NewsRegisterProps {
  onClose?: () => void
  onSuccess?: () => void
}

export default function NewsRegister({
  onClose,
  onSuccess,
}: NewsRegisterProps) {
  const createMutation = useCreateNews()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    trigger,
  } = useForm({
    resolver: zodResolver(CreateNewsSchema),
    mode: 'onChange',
  })

  const handlePicture = (files: File[]) => {
    if (files.length > 0) {
      setValue('photo', files[0], { shouldValidate: true })
    } else {
      setValue('photo', undefined, { shouldValidate: true })
    }

    setTimeout(() => trigger('photo'), 100)
  }

  async function handleNews(data: CreateNewsSchema) {
    createMutation.mutate(data, {
      onSuccess: () => {
        reset()
        onSuccess?.()
        onClose?.()
      },
    })
  }

  return (
    <form
      className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 rounded-md w-full"
      onSubmit={handleSubmit(handleNews)}
      noValidate
    >
      <FormInput
        label="Título"
        id="title"
        type="text"
        placeholder="Qual o título da notícia?"
        error={errors.title?.message}
        register={register('title')}
        disabled={createMutation.isPending}
        paddingVariant="without-icon"
      />

      <CategoryInput
        label="Categoria"
        id="category"
        placeholder="Selecione ou digite a categoria"
        error={errors.category?.message}
        register={register('category')}
        disabled={createMutation.isPending}
        paddingVariant="without-icon"
        onSelectSuggestion={(value) =>
          setValue('category', value, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
      />

      <FormTextarea
        label="Resumo"
        id="summary"
        rows={4}
        placeholder="Esse é o texto que ficará exposto com prévia da notícia"
        error={errors.summary?.message}
        register={register('summary')}
        disabled={createMutation.isPending}
        paddingVariant="standard"
      />

      <FormTextarea
        label="Conteúdo"
        id="content"
        rows={6}
        placeholder="Esse é o corpo da notícia"
        error={errors.content?.message}
        register={register('content')}
        disabled={createMutation.isPending}
        paddingVariant="standard"
      />

      <div className="flex flex-col w-full">
        <label className="mb-1 font-medium">Foto</label>
        <PhotoUploader onChange={handlePicture} />
        {errors.photo && (
          <div className="text-red-500">{String(errors.photo.message)}</div>
        )}
      </div>

      <div className="grid w-full mt-8">
        <RoundedButton
          color="#000000"
          hoverColor="#E25E3E"
          text={createMutation.isPending ? 'Cadastrando...' : 'Cadastrar'}
          textColor="white"
          disabled={createMutation.isPending}
        />
      </div>
      <div className="flex justify-center text-sm">
        <a
          onClick={onClose}
          className="text-[#E25E3E] underline ml-1 hover:text-[#E20E3E] cursor-pointer"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
