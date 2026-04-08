import RadioButtonIcon from '@/src/components/icons/radioButtonIcon'
import PhotoUploader from '@/src/components/ui/PhotoUploader'
import RoundedButton from '@/src/components/ui/RoundedButton'
import FormInput from '@/src/components/ui/FormInput'
import FormTextarea from '@/src/components/ui/FormTextarea'
import FormSelect from '@/src/components/ui/FormSelect'
import ArrowDownIcon from '@/src/components/icons/arrowDownIcon'
import { useUpdateNews } from '@/src/hooks/news/useNewsMutations'
import { NewsSchema, UpdateNewsSchema } from '@/src/schemas/users/News'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import CategoryInput from './CategoryInput'

interface NewsEditingProps {
  onClose?: () => void
  onSuccess?: () => void
  news?: NewsSchema | null
}

export default function NewsEditing({
  onSuccess,
  onClose,
  news,
}: NewsEditingProps) {
  const updateMutation = useUpdateNews()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm({
    resolver: zodResolver(UpdateNewsSchema),
    mode: 'onChange',
    defaultValues: {
      id: news?.id || '',
      title: news?.title || '',
      category: news?.category || '',
      summary: news?.summary || '',
      content: news?.content || '',
      isActive: news?.isActive ?? true,
    },
  })

  const getImageUrl = (photoUrl: string | undefined) => {
    if (!photoUrl) return undefined

    if (photoUrl.startsWith('http')) {
      return photoUrl
    }

    return `${process.env.NEXT_PUBLIC_API_URL}/uploads/news/${photoUrl}`
  }

  const handlePicture = (files: File[]) => {
    if (files.length > 0) {
      setValue('photo', files[0], { shouldValidate: true })
    } else {
      setValue('photo', undefined, { shouldValidate: true })
    }

    setTimeout(() => trigger('photo'), 100)
  }

  async function handleNews(data: UpdateNewsSchema) {
    if (!news?.id) return

    updateMutation.mutate(
      { data, newsId: news.id },
      {
        onSuccess: () => {
          onSuccess?.()
          onClose?.()
        },
      },
    )
  }

  useEffect(() => {
    if (news) {
      setValue('id', news.id || '')
      setValue('title', news.title || '')
      setValue('category', news.category || '')
      setValue('summary', news.summary || '')
      setValue('content', news.content || '')
      setValue('isActive', news.isActive ?? true)
    }
  }, [news, setValue])

  const currentIsActive = watch('isActive')
  const imageUrl = getImageUrl(news?.photoUrl)

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
        placeholder="Digite o título da notícia"
        error={errors.title?.message}
        register={register('title')}
        disabled={updateMutation.isPending}
        paddingVariant="without-icon"
      />

      <CategoryInput
        label="Categoria"
        id="category"
        placeholder="Selecione ou digite a categoria"
        error={errors.category?.message}
        register={register('category')}
        disabled={updateMutation.isPending}
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
        disabled={updateMutation.isPending}
        paddingVariant="standard"
      />

      <FormTextarea
        label="Conteúdo"
        id="content"
        rows={6}
        placeholder="Digite o conteúdo completo da notícia"
        error={errors.content?.message}
        register={register('content')}
        disabled={updateMutation.isPending}
        paddingVariant="standard"
      />

      <FormSelect
        label="Status"
        id="status"
        leftIcon={<RadioButtonIcon width={20} height={20} color="#747473" />}
        rightIcon={<ArrowDownIcon width={20} height={20} />}
        error={errors.isActive?.message}
        disabled={updateMutation.isPending}
        options={[
          { value: 'true', label: 'Ativo' },
          { value: 'false', label: 'Inativo' },
        ]}
        value={currentIsActive ? 'true' : 'false'}
        onChange={(e) => {
          setValue('isActive', e.target.value === 'true')
        }}
      />

      <div className="flex flex-col">
        <label className="mb-1 font-medium">Foto</label>
        <PhotoUploader onChange={handlePicture} defaultValue={imageUrl} />
        {errors.photo && (
          <div className="text-red-500">{errors.photo.message as string}</div>
        )}
      </div>

      <div className="grid w-full mt-8">
        <RoundedButton
          color="#000000"
          hoverColor="#E25E3E"
          text={updateMutation.isPending ? 'Atualizando...' : 'Atualizar'}
          textColor="white"
          disabled={updateMutation.isPending}
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
